# Bộ khung dự án T Rex English

Bộ khung bổ sung vị trí các file còn thiếu để bạn tự viết mã theo tài liệu
`Huong_dan_Xay_dung_Toan_bo_T_Rex_English.docx`. Nội dung ứng dụng có sẵn
được giữ nguyên; đây chưa phải bản triển khai đầy đủ các chức năng trong Word.

## Cách dùng

1. Tìm file trong bảng đối chiếu bên dưới, mở đường dẫn thực tế trong dự án.
2. Với file mới có `TODO`, thay toàn bộ khung bằng nội dung tương ứng trong Word.
3. Với file có sẵn, đọc và đối chiếu trước khi thay. Không chép nối vào cuối file
   vì có thể gây trùng export hoặc trộn logic localStorage với database.
4. Các file `export {};` chỉ tạo module hợp lệ. Chúng chưa có hàm hoặc component
   để import theo bộ Word; hãy hoàn thiện nhóm dependency cùng nhau.
5. Các page mới tạm trả 404 qua `notFound()`. Đây là chủ ý của khung, chưa phải
   lỗi xác thực. Các trang cũ tiếp tục dùng logic hiện có.

## Nhóm route learn và đường dẫn trong Word

Next.js bỏ tên nhóm `(learn)` khỏi URL. Ví dụ
`src/app/(learn)/decks/page.tsx` vẫn là `/decks`.
Không tạo thêm `src/app/decks/page.tsx` song song: hai file đó trùng URL.
`src/app/(learn)/layout.tsx` hiện chỉ trả children, nên giữ được khi bạn áp dụng
trang mới. Word dùng cấu trúc phẳng cho các trang học; bảng bên dưới chỉ rõ nơi
đặt mã trong dự án này. Không di chuyển các file đã có chỉ để giống hình cây Word.

## Ý nghĩa từng nhóm

| Nhóm | Trách nhiệm |
| --- | --- |
| `src/app` | Route, layout, các màn hình và trạng thái lỗi/loading của Next |
| `src/app/(learn)` | Thư viện, flashcard, quiz, test, phiên đang làm và lịch sử |
| `src/app/admin` | Trang quản trị tài khoản và nội dung; phải kiểm tra quyền server khi triển khai |
| `src/actions` | Server Actions nhận thao tác, kiểm tra đầu vào và quyền trước khi ghi dữ liệu |
| `src/lib` | Kiểu dữ liệu, validation, helper Auth, Prisma và luật quiz/test |
| `src/lib/supabase` | Kết nối Auth phía server và cookie |
| `src/components` | Form và giao diện có thể dùng lại |
| `prisma` | Schema, lịch sử migration, dữ liệu mẫu |
| `scripts` | Lệnh seed, kiểm thử logic và SQL cấp admin đầu tiên |
| `docs` | Bảng đối chiếu và mẫu email Supabase |
| `public` | Ảnh, logo và tài nguyên tĩnh có sẵn |

## File bổ sung cần chú ý

Phần Database và Auth đã được điền mã. Xem `prisma/README.md` và
`docs/DANG_KY_DANG_NHAP.md` để biết trạng thái triển khai hiện tại và cách kiểm tra.
Các trang học và quản lý nội dung vẫn còn dùng logic demo hoặc khung TODO.
Các nhãn trong bảng bên dưới ghi lại trạng thái khi tạo khung ban đầu;
các trang đăng ký, đăng nhập, account và khôi phục hiện đã được triển khai.
File bổ sung cho giao diện Auth: `src/app/auth.css`, `src/components/auth-fields.tsx`;
cấu hình origin: `src/lib/auth-config.ts`; kiểm thử: `scripts/test-auth.cjs`;
bảo vệ nhóm admin: `src/app/admin/layout.tsx`.

- `scripts/seed.cjs` đã có mã nhập dữ liệu mẫu. `npm run db:seed` sẽ kết nối
  database qua `DIRECT_URL` và ghi dữ liệu; chỉ chạy khi đã kiểm tra database đích.
- `scripts/test-logic.cjs` cũng trả mã thoát 1 khi chưa có kiểm thử thật,
  không báo kiểm thử thành công giả. Hoàn thiện rồi chạy `npm run test:logic`.
- `scripts/bootstrap-admin.sql` chủ động báo lỗi TODO nếu chạy nhầm.
  Chỉ thay bằng SQL hoàn chỉnh, điền đúng UUID đã xác nhận rồi mới chạy.
- Migration bổ sung đã có đầy đủ SQL tại
  `prisma/migrations/20260915000000_learning_sessions/migration.sql`.
  Bản TODO đã được bỏ. `npm run db:migrate` sẽ áp dụng migration này nếu chưa có
  trong lịch sử của database đích. Việc điền mã chưa tự chạy migration.
- Hai file HTML email trong `docs` đã có nội dung. Dùng khi cấu hình mẫu
  Confirm signup và Reset password của Supabase; xem hướng dẫn Auth trước.
- `.env.example` chỉ chứa placeholder. `.env` thật được giữ nguyên và vẫn
  bị Git bỏ qua. Không đưa password, token hoặc connection string thật vào Git.

## File cũ và file mới có tên gần nhau

Giữ các component demo như `learning-provider.tsx`, `question-session.tsx`,
`study-session.tsx`, `flashcards.tsx`, `site-shell.tsx` trong lúc tự học.
Các component mới như `session-player.tsx`, `study.tsx`, `content-editor.tsx`
là vị trí mã cho bản Word. Đừng xóa component cũ khi các trang đang còn import.
Khi đã chuyển hết theo Word, rà lại import trước khi dọn những file không dùng.
Đặc biệt, layout của bản mới cần bỏ provider localStorage theo hướng dẫn để
không giữ hai nguồn tiến độ khác nhau.

## Cây thư mục

Cây dưới đây bỏ qua dependency, cache và chi tiết ảnh trong `public`.
`node_modules`, `.next`, `src/generated/prisma`, `next-env.d.ts` là các file
hoặc thư mục sinh tự động, không cần tự gõ. `package-lock.json` do npm quản lý,
giữ trong Git để các lần cài dependency thống nhất.

```text
trex_english/
├── .env.example
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── docs/
│   ├── CAU_TRUC_DU_AN.md
│   ├── supabase-confirm-email.html
│   └── supabase-reset-email.html
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── prisma.config.ts
├── prisma/
│   ├── README.md
│   ├── migrations/
│   │   ├── 20260913000000_init_learning/
│   │   │   └── migration.sql
│   │   ├── 20260915000000_learning_sessions/
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   ├── schema.prisma
│   └── seed-data.ts
├── scripts/
│   ├── bootstrap-admin.sql
│   ├── seed.cjs
│   └── test-logic.cjs
├── src/
│   ├── actions/
│   │   ├── admin.ts
│   │   ├── attempts.ts
│   │   ├── auth.ts
│   │   ├── content.ts
│   │   └── learning.ts
│   ├── app/
│   │   ├── (learn)/
│   │   │   ├── attempts/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── decks/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── edit/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── study/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── quiz/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── sessions/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── tests/
│   │   │       ├── [id]/
│   │   │       │   └── page.tsx
│   │   │       └── page.tsx
│   │   ├── account/
│   │   │   └── page.tsx
│   │   ├── admin/
│   │   │   ├── content/
│   │   │   │   └── page.tsx
│   │   │   ├── page.tsx
│   │   │   └── tests/
│   │   │       └── [id]/
│   │   │           └── page.tsx
│   │   ├── auth/
│   │   │   ├── confirm/
│   │   │   │   └── route.ts
│   │   │   └── error/
│   │   │       └── page.tsx
│   │   ├── error.tsx
│   │   ├── favicon.ico
│   │   ├── forbidden/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   ├── global-error.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── not-found.tsx
│   │   ├── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── reset-password/
│   │       └── page.tsx
│   ├── components/
│   │   ├── attempt-result.tsx
│   │   ├── auth-screen.tsx
│   │   ├── coming-soon.tsx
│   │   ├── content-editor.tsx
│   │   ├── dashboard.tsx
│   │   ├── deck-detail.tsx
│   │   ├── deck-library.tsx
│   │   ├── flashcards.tsx
│   │   ├── learning-provider.tsx
│   │   ├── question-session.tsx
│   │   ├── recovery-form.tsx
│   │   ├── role-form.tsx
│   │   ├── session-player.tsx
│   │   ├── site-shell.tsx
│   │   ├── start-button.tsx
│   │   ├── study-session.tsx
│   │   ├── study.tsx
│   │   ├── submit.tsx
│   │   ├── test-library.tsx
│   │   └── ui.tsx
│   ├── lib/
│   │   ├── auth-types.ts
│   │   ├── auth.ts
│   │   ├── content-schema.ts
│   │   ├── db.ts
│   │   ├── learning-data.ts
│   │   ├── learning.ts
│   │   ├── session-engine.ts
│   │   ├── supabase/
│   │   │   └── server.ts
│   │   └── validation.ts
│   └── proxy.ts
└── tsconfig.json
```

## Đối chiếu toàn bộ file trong Word

| Trong Word | Trong dự án hiện tại | Trạng thái khi tạo khung |
| --- | --- | --- |
| `.env.example` | `.env.example` | Mới — khung TODO |
| `src/lib/auth-types.ts` | `src/lib/auth-types.ts` | Mới — khung TODO |
| `src/lib/validation.ts` | `src/lib/validation.ts` | Có sẵn — giữ nguyên |
| `src/lib/db.ts` | `src/lib/db.ts` | Đã điền mã Database |
| `src/lib/supabase/server.ts` | `src/lib/supabase/server.ts` | Có sẵn — giữ nguyên |
| `src/proxy.ts` | `src/proxy.ts` | Có sẵn — giữ nguyên |
| `src/lib/auth.ts` | `src/lib/auth.ts` | Có sẵn — giữ nguyên |
| `src/actions/auth.ts` | `src/actions/auth.ts` | Có sẵn — giữ nguyên |
| `src/app/auth/confirm/route.ts` | `src/app/auth/confirm/route.ts` | Có sẵn — giữ nguyên |
| `src/app/auth/error/page.tsx` | `src/app/auth/error/page.tsx` | Mới — khung TODO |
| `src/components/auth-screen.tsx` | `src/components/auth-screen.tsx` | Có sẵn — giữ nguyên |
| `src/app/login/page.tsx` | `src/app/login/page.tsx` | Có sẵn — giữ nguyên |
| `src/app/register/page.tsx` | `src/app/register/page.tsx` | Có sẵn — giữ nguyên |
| `src/app/account/page.tsx` | `src/app/account/page.tsx` | Mới — khung TODO |
| `src/app/forbidden/page.tsx` | `src/app/forbidden/page.tsx` | Mới — khung TODO |
| `src/actions/admin.ts` | `src/actions/admin.ts` | Có sẵn — giữ nguyên |
| `src/components/role-form.tsx` | `src/components/role-form.tsx` | Mới — khung TODO |
| `docs/supabase-confirm-email.html` | `docs/supabase-confirm-email.html` | Mới — khung TODO |
| `scripts/bootstrap-admin.sql` | `scripts/bootstrap-admin.sql` | Mới — khung TODO |
| `package.json` | `package.json` | Có sẵn — giữ nguyên |
| `tsconfig.json` | `tsconfig.json` | Có sẵn — giữ nguyên |
| `next.config.ts` | `next.config.ts` | Có sẵn — giữ nguyên |
| `eslint.config.mjs` | `eslint.config.mjs` | Có sẵn — giữ nguyên |
| `.gitignore` | `.gitignore` | Có sẵn — giữ nguyên |
| `prisma/schema.prisma` | `prisma/schema.prisma` | Đã bổ sung LearningSession |
| `prisma.config.ts` | `prisma.config.ts` | Có sẵn — giữ nguyên |
| `prisma/migrations/migration_lock.toml` | `prisma/migrations/migration_lock.toml` | Có sẵn — giữ nguyên |
| `prisma/migrations/20260913000000_init_learning/migration.sql` | `prisma/migrations/20260913000000_init_learning/migration.sql` | Có sẵn — giữ nguyên |
| `prisma/migrations/20260915000000_learning_sessions/migration.sql` | `prisma/migrations/20260915000000_learning_sessions/migration.sql` | Đã điền mã Database |
| `prisma/seed-data.ts` | `prisma/seed-data.ts` | Đã có đủ dữ liệu mẫu, giữ nguyên |
| `scripts/seed.cjs` | `scripts/seed.cjs` | Đã điền mã Database |
| `src/lib/session-engine.ts` | `src/lib/session-engine.ts` | Mới — khung TODO |
| `src/lib/learning.ts` | `src/lib/learning.ts` | Mới — khung TODO |
| `src/actions/learning.ts` | `src/actions/learning.ts` | Có sẵn — giữ nguyên |
| `src/actions/attempts.ts` | `src/actions/attempts.ts` | Có sẵn — giữ nguyên |
| `src/components/session-player.tsx` | `src/components/session-player.tsx` | Mới — khung TODO |
| `src/components/start-button.tsx` | `src/components/start-button.tsx` | Mới — khung TODO |
| `src/app/sessions/[id]/page.tsx` | `src/app/(learn)/sessions/[id]/page.tsx` | Mới — khung TODO |
| `src/app/attempts/[id]/page.tsx` | `src/app/(learn)/attempts/[id]/page.tsx` | Có sẵn — giữ nguyên |
| `src/components/study.tsx` | `src/components/study.tsx` | Mới — khung TODO |
| `src/app/decks/[id]/study/page.tsx` | `src/app/(learn)/decks/[id]/study/page.tsx` | Có sẵn — giữ nguyên |
| `src/app/decks/page.tsx` | `src/app/(learn)/decks/page.tsx` | Có sẵn — giữ nguyên |
| `src/app/decks/[id]/page.tsx` | `src/app/(learn)/decks/[id]/page.tsx` | Có sẵn — giữ nguyên |
| `src/app/quiz/page.tsx` | `src/app/(learn)/quiz/page.tsx` | Có sẵn — giữ nguyên |
| `src/app/quiz/[id]/page.tsx` | `src/app/(learn)/quiz/[id]/page.tsx` | Có sẵn — giữ nguyên |
| `src/app/tests/page.tsx` | `src/app/(learn)/tests/page.tsx` | Có sẵn — giữ nguyên |
| `src/app/tests/[id]/page.tsx` | `src/app/(learn)/tests/[id]/page.tsx` | Có sẵn — giữ nguyên |
| `src/lib/content-schema.ts` | `src/lib/content-schema.ts` | Mới — khung TODO |
| `src/actions/content.ts` | `src/actions/content.ts` | Mới — khung TODO |
| `src/components/content-editor.tsx` | `src/components/content-editor.tsx` | Mới — khung TODO |
| `src/app/decks/new/page.tsx` | `src/app/(learn)/decks/new/page.tsx` | Mới — khung TODO |
| `src/app/decks/[id]/edit/page.tsx` | `src/app/(learn)/decks/[id]/edit/page.tsx` | Mới — khung TODO |
| `src/app/admin/content/page.tsx` | `src/app/admin/content/page.tsx` | Mới — khung TODO |
| `src/app/admin/tests/[id]/page.tsx` | `src/app/admin/tests/[id]/page.tsx` | Mới — khung TODO |
| `src/app/admin/page.tsx` | `src/app/admin/page.tsx` | Có sẵn — giữ nguyên |
| `src/app/dashboard/page.tsx` | `src/app/(learn)/dashboard/page.tsx` | Có sẵn — giữ nguyên |
| `src/components/recovery-form.tsx` | `src/components/recovery-form.tsx` | Mới — khung TODO |
| `src/app/forgot-password/page.tsx` | `src/app/forgot-password/page.tsx` | Mới — khung TODO |
| `src/app/reset-password/page.tsx` | `src/app/reset-password/page.tsx` | Mới — khung TODO |
| `docs/supabase-reset-email.html` | `docs/supabase-reset-email.html` | Mới — khung TODO |
| `src/app/layout.tsx` | `src/app/layout.tsx` | Có sẵn — giữ nguyên |
| `src/app/page.tsx` | `src/app/page.tsx` | Có sẵn — giữ nguyên |
| `src/app/globals.css` | `src/app/globals.css` | Có sẵn — giữ nguyên |
| `src/app/loading.tsx` | `src/app/loading.tsx` | Có sẵn — giữ nguyên |
| `src/app/error.tsx` | `src/app/error.tsx` | Có sẵn — giữ nguyên |
| `src/app/global-error.tsx` | `src/app/global-error.tsx` | Mới — khung TODO |
| `src/app/not-found.tsx` | `src/app/not-found.tsx` | Có sẵn — giữ nguyên |
| `scripts/test-logic.cjs` | `scripts/test-logic.cjs` | Mới — khung TODO |

## Thứ tự tự hoàn thiện

1. Cấu hình và schema, migration, seed.
2. Auth helpers, actions, email, đăng ký/đăng nhập và quyền admin.
3. Truy vấn bộ từ và flashcard, lưu tiến độ.
4. Session engine, actions, giao diện quiz/test và kết quả.
5. Form nội dung và quyền tạo/sửa/xóa.
6. Dashboard, layout, CSS và kiểm thử tích hợp.

Đọc toàn bộ hướng dẫn trước khi chạy các lệnh thay đổi database. Việc các file
đã tồn tại không có nghĩa chức năng đã chạy: cần viết đầy đủ mã, ghép import,
cấu hình môi trường và thử theo checklist của Word.


## Cập nhật admin ngày 15/09/2026

Các nhãn “khung TODO” trong bảng đối chiếu ban đầu ở trên mô tả thời điểm tạo khung. Hiện nhóm admin/content, content-schema, content-editor, role-form, bootstrap-admin, session-engine, session-player, start-button và test-logic đã được triển khai. Bổ sung `src/lib/catalog.ts`, `src/actions/attempts.ts`, `src/app/admin/decks/[id]`, `src/app/admin/users`, `src/app/admin/attempts/[id]`, `src/components/admin-pagination.tsx`, `scripts/test-admin.cjs` và CSS admin.

Trạng thái chức năng, file phụ trách và giới hạn đồng bộ được cập nhật đầy đủ tại [QUAN_TRI.md](QUAN_TRI.md). Word cũ là tài liệu tham khảo; dùng mã hiện tại và tài liệu này khi kiểm tra phần admin vừa hoàn thiện.
