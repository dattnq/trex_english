import type { Instrumentation } from "next";
// Structured server logs omit URLs, headers, form data and error messages that may contain secrets.
export const onRequestError:Instrumentation.onRequestError=(error,_request,context)=>{
 console.error(JSON.stringify({event:"request_error",at:new Date().toISOString(),digest:typeof error==="object"&&error!==null&&"digest" in error?String(error.digest):null,route:context.routePath,type:context.routeType}));
};
