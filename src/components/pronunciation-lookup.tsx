"use client";
import { useState } from "react";
import PronunciationFields from "./pronunciation-fields";
export default function PronunciationLookup(){
 const [value,setValue]=useState({term:"",phonetic:""});
 return <details className="panel pronunciation-lookup"><summary>Tra IPA & nghe phát âm</summary><p>Nhập một từ rồi rời ô tiếng Anh để tự điền IPA. Ô tra cứu này không thay đổi bộ từ của bạn.</p><PronunciationFields value={value} onChange={setValue}/></details>;
}
