const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { NextResponse } = require('next/server');
const root = path.resolve(__dirname, '..');

// Exercise the actual server modules without real credentials, mail or database writes.
function context(overrides = {}) {
  const calls = [];
  const user = { id: 'a88f84da-4fd4-405b-971b-cd6b01c85868', email: 'test@example.invalid',
    email_confirmed_at: '2026-01-01', user_metadata: { display_name: ' Người học ', role: 'ADMIN' } };
  const defaults = {
    signInWithOAuth: { data: {url:"https://auth.example.invalid/auth/v1/authorize?provider=google"}, error:null },
    signUp: { data: { user, session: null }, error: null },
    signInWithPassword: { data: { user, session: {} }, error: null },
    getUser: { data: { user }, error: null },
    resend: { error: null }, resetPasswordForEmail: { error: null },
    updateUser: { error: null }, signOut: { error: null },
    verifyOtp: { data: { user }, error: null }, exchangeCodeForSession: { data: { user }, error: null },
  };
  const auth = Object.fromEntries(Object.keys(defaults).map(name => [name, async (...args) => {
    calls.push({ name, args });
    if (overrides[name] instanceof Error) throw overrides[name];
    return overrides[name] ?? defaults[name];
  }]));
  const db = { profile: {
    upsert: async args => { calls.push({ name: 'profile', args: [args] }); return { ...args.create, role: overrides.role ?? args.create.role }; },
    findUnique: async () => ({ id: user.id, displayName: 'Người học', role: overrides.role ?? 'LEARNER' }),
  }};
  const cache = new Map();
  function load(file) {
    const absolute = path.resolve(root, file);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const loaded = { exports: {} }; cache.set(absolute, loaded);
    const source = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const customRequire = name => {
      if (name === 'server-only') return {};
      if (name === '@/components/auth-screen') return { default: () => null };
      if (name === 'react') return { cache: fn => fn };
      if (name === 'next/navigation') return { redirect: url => { throw Object.assign(new Error('redirect'), { url }); } };
      if (name === 'next/cache') return { revalidatePath: () => {} };
      if (name === 'next/server') return { NextResponse };
      if (name.endsWith('/supabase/server')) return { createClient: async () => ({ auth }) };
      if (name === './db' || name === '@/lib/db') return { db };
      if (name === '@/lib/auth-config') return { appOrigin: () => 'https://trex.test', googleProviderEnabled: async () => { if (overrides.googleEnabled instanceof Error) throw overrides.googleEnabled; return overrides.googleEnabled ?? true; } };
      if (name.startsWith('@/')) return load('src/' + name.slice(2) + '.ts');
      if (name.startsWith('.')) return load(path.resolve(path.dirname(absolute), name + '.ts'));
      return require(name);
    };
    new Function('exports', 'module', 'require', source)(loaded.exports, loaded, customRequire);
    return loaded.exports;
  }
  return { load, calls, user, actions: load('src/actions/auth.ts') };
}
function form(fields) { const f = new FormData(); for (const [key,value] of Object.entries(fields)) f.set(key,value); return f; }
const registration = { displayName: 'Người học', email: ' Test@example.invalid ', password: '  Secret123  ', confirmPassword: '  Secret123  ', role: 'ADMIN' };

test('password whitespace is preserved; short existing passwords can reach login', () => {
  const { load } = context(); const v = load('src/lib/validation.ts');
  assert.equal(v.registerSchema.parse(registration).password, registration.password);
  assert.equal(v.registerSchema.parse(registration).email, 'test@example.invalid');
  assert.equal(v.loginSchema.parse({ email: 'a@example.invalid', password: 'x' }).password, 'x');
  assert.equal(v.registerSchema.safeParse({ ...registration, displayName: 'x'.repeat(81) }).success, false);
});
test('mismatched signup stops before Auth or database calls', async () => {
  const c = context();
  const result = await c.actions.registerAction({}, form({ ...registration, confirmPassword: 'Different123' }));
  assert.equal(result.status, 'error'); assert(result.errors.confirmPassword); assert.equal(c.calls.length, 0);
});
test('signup requests confirmation and cannot pass an admin role', async () => {
  const c = context(); const result = await c.actions.registerAction({}, form(registration));
  assert.equal(result.status, 'success'); assert.equal(c.calls.length, 1);
  const options = c.calls[0].args[0]; assert.deepEqual(options.options.data, { display_name: 'Người học' });
  assert.equal(options.password, registration.password);
  assert.equal(options.options.emailRedirectTo, 'https://trex.test/auth/confirm');
});
test('login creates only learner profile and redirects after confirmation', async () => {
  const c = context();
  await assert.rejects(c.actions.loginAction({}, form(registration)), e => e.url === '/');
  const profile = c.calls.find(c => c.name === 'profile').args[0];
  assert.equal(profile.create.role, 'LEARNER'); assert.deepEqual(profile.update, {});
  assert.equal(c.calls[0].args[0].password, registration.password);
});
test('unconfirmed login clears accidental session without creating profile', async () => {
  const c = context({ signInWithPassword: { data: { user: { email_confirmed_at: null }, session: {} }, error: null } });
  assert.equal((await c.actions.loginAction({}, form(registration))).status, 'error');
  assert(c.calls.some(c => c.name === 'signOut')); assert(!c.calls.some(c => c.name === 'profile'));
});
test('failed login stays on form and rate-limit feedback is actionable', async () => {
  const c = context({ signInWithPassword: { data: {}, error: { status: 429 } } });
  const result = await c.actions.loginAction({}, form(registration));
  assert.equal(result.status, 'error'); assert.match(result.message, /chờ/);
});
test('profile guard refuses unconfirmed email', async () => {
  const c = context();
  await assert.rejects(c.load('src/lib/auth.ts').ensureProfile({ ...c.user, email_confirmed_at: null }));
  assert(!c.calls.some(c => c.name === 'profile'));
});
test('recovery validates mode and reports service failure without leaking details', async () => {
  const c = context({ resetPasswordForEmail: { error: { status: 500, message: 'PRIVATE DETAILS' } } });
  assert.equal((await c.actions.recoveryAction({}, form({ email: 'a@example.invalid', mode: 'bogus' }))).status, 'error');
  assert.equal(c.calls.length, 0);
  const result = await c.actions.recoveryAction({}, form({ email: 'a@example.invalid', mode: 'reset' }));
  assert.equal(result.status, 'error'); assert(!result.message.includes('PRIVATE'));
});
test('resend uses signup mode; account-specific errors stay generic', async () => {
  const c = context({ resend: { error: { status: 400 } } });
  assert.equal((await c.actions.recoveryAction({}, form({ email: 'a@example.invalid', mode: 'resend' }))).status, 'success');
  assert.equal(c.calls[0].args[0].type, 'signup');
});
test('reset needs a verified session, then updates password and signs out globally', async () => {
  const invalid = context({ getUser: { data: { user: null }, error: null } });
  assert.equal((await invalid.actions.resetAction({}, form(registration))).status, 'error');
  assert(!invalid.calls.some(c => c.name === 'updateUser'));
  const c = context();
  await assert.rejects(c.actions.resetAction({}, form(registration)), e => e.url === '/login?updated=1');
  assert.equal(c.calls.find(c => c.name === 'updateUser').args[0].password, registration.password);
  assert.equal(c.calls.find(c => c.name === 'signOut').args[0].scope, 'global');
});
test('logout failure does not claim success', async () => {
  const c = context({ signOut: { error: { status: 500 } } });
  assert.equal((await c.actions.logoutAction()).status, 'error');
});
test('protected account and admin helpers reject guests and learners', async () => {
  const guest = context({ getUser: { data: { user: null }, error: null } });
  await assert.rejects(guest.load('src/lib/auth.ts').requireUser(), e => e.url === '/login');
  const learner = context();
  await assert.rejects(learner.load('src/lib/auth.ts').requireAdmin(), e => e.url === '/forbidden');
});
test('callback supports OTP and PKCE and never redirects to an untrusted URL', async () => {
  const otp = context(); const handler = otp.load('src/app/auth/confirm/route.ts').GET;
  const result = await handler({ nextUrl: new URL('https://trex.test/auth/confirm?token_hash=fake&type=recovery') });
  assert.equal(result.headers.get('location'), 'https://trex.test/reset-password');
  assert.equal(result.headers.get('cache-control'), 'private, no-store');
  const pkce = context(); const redirect = await pkce.load('src/app/auth/confirm/route.ts').GET({ nextUrl: new URL('https://trex.test/auth/confirm?code=fake&next=https://evil.invalid') });
  assert.equal(redirect.headers.get('location'), 'https://trex.test/');
  const invalid = context(); const error = await invalid.load('src/app/auth/confirm/route.ts').GET({ nextUrl: new URL('https://trex.test/auth/confirm?token_hash=fake&type=unknown') });
  assert.equal(error.headers.get('location'), 'https://trex.test/auth/error'); assert.equal(invalid.calls.length, 0);
});

test('Google login uses PKCE client, fixed callback and account chooser', async () => {
  const c=context();
  await assert.rejects(c.actions.googleLoginAction(), e=>e.url==='https://auth.example.invalid/auth/v1/authorize?provider=google');
  assert.deepEqual(c.calls[0],{name:'signInWithOAuth',args:[{provider:'google',options:{redirectTo:'https://trex.test/auth/confirm',skipBrowserRedirect:true,queryParams:{prompt:'select_account'}}}]});
  assert(!c.calls.some(x=>x.name==='profile'));
});
test('disabled Google provider stays on the form without starting OAuth', async () => {
  const c=context({googleEnabled:false});const r=await c.actions.googleLoginAction();assert.equal(r.status,'error');assert.match(r.message,/chưa sẵn sàng/);assert.equal(c.calls.length,0);
});
test('Google provider/network errors are recoverable and do not leak details', async () => {
  for(const overrides of [{googleEnabled:new Error('PRIVATE')},{signInWithOAuth:{data:{url:null},error:{status:500,message:'PRIVATE'}}},{signInWithOAuth:{data:{url:null},error:null}}]){
    const c=context(overrides),r=await c.actions.googleLoginAction();assert.equal(r.status,'error');assert(!r.message.includes('PRIVATE'));
  }
});
test('Google profile gets display name but never metadata admin privileges', async () => {
  const c=context();const result=await c.load('src/lib/auth.ts').ensureProfile({...c.user,user_metadata:{full_name:' Google Learner ',role:'ADMIN'}});
  assert.equal(result.displayName,'Google Learner');assert.equal(result.role,'LEARNER');assert.deepEqual(c.calls[0].args[0].update,{});
});
test('canceled or failed Google callback does not create a profile', async () => {
  const canceled=context();const r=await canceled.load('src/app/auth/confirm/route.ts').GET({nextUrl:new URL('https://trex.test/auth/confirm?error=access_denied&code=fake')});
  assert.equal(r.headers.get('location'),'https://trex.test/auth/error');assert.equal(canceled.calls.length,0);
  const failed=context({exchangeCodeForSession:{data:{user:null},error:{message:'invalid code'}}});await failed.load('src/app/auth/confirm/route.ts').GET({nextUrl:new URL('https://trex.test/auth/confirm?code=expired')});assert(!failed.calls.some(x=>x.name==='profile'));
});

for (const [role, destination] of [['LEARNER', '/'], ['ADMIN', '/admin']]) {
  test(`${role} password login uses the stored profile role`, async () => {
    const c = context({ role });
    await assert.rejects(c.actions.loginAction({}, form(registration)), e => e.url === destination);
  });

  test(`${role} immediate signup session uses the role destination`, async () => {
    const seed = context();
    const c = context({ role, signUp: { data: { user: seed.user, session: {} }, error: null } });
    await assert.rejects(c.actions.registerAction({}, form(registration)), e => e.url === destination);
  });

  test(`${role} authenticated login and register pages redirect automatically`, async () => {
    for (const page of ['login', 'register']) {
      const c = context({ role });
      await assert.rejects(c.load(`src/app/${page}/page.tsx`).default({ searchParams: Promise.resolve({}) }), e => e.url === destination);
    }
  });

  test(`${role} callback routes OAuth and email confirmation while preserving recovery`, async () => {
    for (const [query, expected] of [
      ['code=fake', destination],
      ['token_hash=fake&type=email', destination],
      ['code=fake&next=https://evil.invalid', destination],
      ['token_hash=fake&type=recovery', '/reset-password'],
      ['code=fake&next=reset-password', '/reset-password'],
    ]) {
      const c = context({ role });
      const response = await c.load('src/app/auth/confirm/route.ts').GET({ nextUrl: new URL(`https://trex.test/auth/confirm?${query}`) });
      assert.equal(response.headers.get('location'), `https://trex.test${expected}`);
    }
  });
}
