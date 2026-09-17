import { questionInput, type ContentInput } from "@/lib/content-schema";

export const questionImportExample = `147. What is the purpose of the email?
A. To place an order
B. To announce a meeting
C. To request a refund
D. To introduce a colleague
Answer: B
Explanation: The email announces the team meeting.

148. When will the meeting start?
A. At 8 a.m.
B. At 9 a.m.
C. At 10 a.m.
D. At 11 a.m.
Answer: C
Explanation: The meeting starts at 10 a.m.`;

// Each block is validated before any questions are appended to the editor.
export function parseQuestionImport(text: string): ContentInput["questions"] {
  if (text.length > 250000) throw new Error("Nội dung dán quá dài (tối đa 250.000 ký tự).");
  const blocks = text.trim().replace(/\r\n?/g, "\n").split(/\n(?=(?:Question\s+|Câu\s+)?\d+[.)]\s)/i);
  if (!text.trim() || blocks.length > 100) throw new Error("Nhập từ 1 đến 100 câu hỏi.");
  const questions = blocks.map((block, index) => {
    const lines = block.split("\n");
    const start = lines.shift()!.match(/^(?:Question\s+|Câu\s+)?(\d+)[.)]\s+(.+)$/i);
    if (!start) throw new Error(`Khối ${index + 1}: bắt đầu bằng số câu, ví dụ 147. What ...?`);
    const options: string[] = [];
    let prompt = start[2], explanation = "", answer: number | undefined;
    let section: "prompt" | "option" | "answer" | "explanation" = "prompt";
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      const option = line.match(/^\(?([A-D])[.)]\s+(.+)$/i);
      const key = line.match(/^(?:Answer|Đáp án)\s*:\s*([A-D])\s*$/i);
      const reason = line.match(/^(?:Explanation|Giải thích)\s*:\s*(.*)$/i);
      if (option) {
        if (answer !== undefined || section === "explanation" || option[1].toUpperCase().charCodeAt(0) - 65 !== options.length) throw new Error(`Câu ${start[1]}: cần đúng thứ tự A, B, C, D trước đáp án.`);
        options.push(option[2]); section = "option";
      } else if (key) {
        if (answer !== undefined || options.length !== 4) throw new Error(`Câu ${start[1]}: nhập đủ A–D và chỉ một dòng Answer.`);
        answer = key[1].toUpperCase().charCodeAt(0) - 65; section = "answer";
      } else if (reason) {
        if (answer === undefined) throw new Error(`Câu ${start[1]}: thêm Answer trước Explanation.`);
        explanation = reason[1]; section = "explanation";
      } else if (section === "prompt") prompt += "\n" + line;
      else if (section === "option") options[options.length - 1] += "\n" + line;
      else if (section === "explanation") explanation += "\n" + line;
      else throw new Error(`Câu ${start[1]}: dòng không nhận diện được: ${line.slice(0,60)}`);
    }
    const result = questionInput.safeParse({ number: Number(start[1]), prompt, options, answer, explanation });
    if (!result.success) throw new Error(`Câu ${start[1]}: cần đủ 4 lựa chọn khác nhau, Answer: A/B/C/D và nội dung hợp lệ.`);
    return result.data;
  });
  if (new Set(questions.map(q => q.number)).size !== questions.length) throw new Error("Các số câu bị trùng nhau.");
  return questions;
}
