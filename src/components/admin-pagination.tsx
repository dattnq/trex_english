import Link from "next/link";
export type AdminSearch=Promise<Record<string,string|string[]|undefined>>;
export function param(value:string|string[]|undefined){return typeof value==="string"?value:"";}
export function pageNumber(value:string|string[]|undefined){const n=Number(param(value));return Number.isSafeInteger(n)&&n>0?Math.min(n,100000):1;}
export function Pager({page,total,base}:{page:number;total:number;base:string}){
 const pages=Math.max(1,Math.ceil(total/20));return <nav className="admin-pager" aria-label="Phân trang">{page>1&&<Link className="button secondary" href={`${base}&page=${page-1}`}>← Trước</Link>}<span>Trang {page}/{pages} · {total} mục</span>{page<pages&&<Link className="button secondary" href={`${base}&page=${page+1}`}>Tiếp →</Link>}</nav>;
}
