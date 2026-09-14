import { NextResponse } from "next/server";
// Chưa kết nối xác thực; không coi proxy này là kiểm tra quyền.
export function proxy() { return NextResponse.next(); }
