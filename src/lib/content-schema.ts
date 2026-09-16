import { z } from "zod";
export const wordInput = z.object({
 id:z.string().min(1).max(160), term:z.string().trim().min(1,"Nhập từ tiếng Anh").max(200),
 phonetic:z.string().trim().max(200), meaning:z.string().trim().min(1,"Nhập nghĩa của từ").max(1000), example:z.string().trim().max(2000),
});
export const questionInput = z.object({
 prompt:z.string().trim().min(1,"Nhập câu hỏi").max(2000),
 options:z.array(z.string().trim().min(1,"Nhập đủ các lựa chọn").max(1000)).length(4).refine(v=>new Set(v.map(s=>s.toLocaleLowerCase())).size===4,"Bốn lựa chọn phải khác nhau"),
 answer:z.number().int().min(0).max(3), explanation:z.string().trim().max(4000),
});
export const contentInput = z.object({
 id:z.string().min(1).max(160).optional(), version:z.iso.datetime().optional(), kind:z.enum(["deck","test"]),
 title:z.string().trim().min(1,"Nhập tên nội dung").max(160), description:z.string().trim().max(2000), category:z.string().trim().min(1,"Nhập chủ đề").max(80),
 level:z.enum(["A1","A2","B1","B2","C1","C2"]), color:z.enum(["blue","green","purple","orange","peach","lilac"]).default("blue"), symbol:z.string().trim().min(1).max(16).default("Aa"),
 published:z.boolean(),minutes:z.number().int().min(1).max(180),words:z.array(wordInput).max(100),questions:z.array(questionInput).max(100),
}).superRefine((v,ctx)=>{
 if(v.id&&!v.version)ctx.addIssue({code:"custom",path:["version"],message:"Tải lại trang để lấy phiên bản mới nhất"});
 if(v.kind==="deck"&&new Set(v.words.map(w=>w.id)).size!==v.words.length)ctx.addIssue({code:"custom",path:["words"],message:"ID từ bị trùng"});
 if(v.published&&(v.kind==="deck"?v.words.length===0:v.questions.length===0))ctx.addIssue({code:"custom",path:[v.kind==="deck"?"words":"questions"],message:"Thêm ít nhất một mục trước khi công khai"});
});
export type ContentInput=z.infer<typeof contentInput>;
export type ContentResult={ok:true;id:string}|{ok:false;message:string};
export const deleteInput=z.object({kind:z.enum(["deck","test"]),id:z.string().min(1).max(160),version:z.iso.datetime()});
