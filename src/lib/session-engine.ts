import { z } from "zod";
import { readingSchema } from "@/lib/reading";
export const QUIZ_QUESTION_MS = 10000;
export const questionSchema = z.object({
  reading: readingSchema.nullish(), number: z.number().int().min(1).max(999).nullish(),
  prompt: z.string().min(1), options: z.array(z.string()).min(2),
  answer: z.number().int().nonnegative(), explanation: z.string(),
}).refine(q => q.answer < q.options.length);
export type Question = z.infer<typeof questionSchema>;
export const stateSchema = z.object({
  quiz: z.boolean(), questions: z.array(questionSchema).min(1).max(100),
  answers: z.array(z.number().int().min(-1)), index: z.number().int().nonnegative(),
  phase: z.enum(["answering", "feedback", "finished"]),
  deadline: z.number(), now: z.number(), endedAt: z.number(),
  revision: z.number().int().nonnegative(),
}).refine(s => s.answers.length === s.questions.length &&
  s.index < s.questions.length && s.answers.every((a, i) =>
    a < s.questions[i].options.length));
export type State = z.infer<typeof stateSchema>;
export type Command = {
  type: "poll" | "select" | "submit";
  index?: number; option?: number; revision: number
};
export function begin(questions: Question[], quiz: boolean,
  durationMs: number, now: number): State {
  return stateSchema.parse({
    quiz, questions, answers: questions.map(() => -1),
    index: 0, phase: "answering", deadline: now + (quiz ? QUIZ_QUESTION_MS : durationMs),
    now, endedAt: 0, revision: 0
  });
}
export function score(s: State) {
  return s.questions.reduce((n, q, i) => n + Number(s.answers[i] === q.answer), 0);
}
export function step(input: State, cmd: Command, now: number): State {
  let s: State = { ...input, answers: [...input.answers], now };
  if (s.phase === "finished") return input;
  let advanced = false;
  // Advance against absolute deadlines, including time spent offline/in another tab.
  while (now >= s.deadline) {
    advanced = true;
    if (!s.quiz || (s.phase === "feedback" && s.index === s.questions.length - 1)) {
      return { ...s, phase: "finished", endedAt: s.deadline, revision: s.revision + 1 };
    }
    s = s.phase === "answering"
      ? { ...s, phase: "feedback", deadline: s.deadline + 1500, revision:s.revision+1 }
      : { ...s, phase: "answering", index: s.index + 1, deadline: s.deadline + QUIZ_QUESTION_MS, revision:s.revision+1 };
  }
  if (advanced) return s;
  if (cmd.revision !== s.revision || cmd.type === "poll") return s;
  if (s.phase !== "answering") return s;
  if (cmd.type === "submit" && !s.quiz) {
    return { ...s, phase: "finished", endedAt: now, revision: s.revision + 1 };
  }
  if (cmd.type === "select") {
    const i = cmd.index, a = cmd.option;
    if (i === undefined || a === undefined || !Number.isInteger(i) ||
      !Number.isInteger(a) || i < 0 || i >= s.questions.length ||
      a < 0 || a >= s.questions[i].options.length || (s.quiz && i !== s.index)) return s;
    s.answers[i] = a;
    return {
      ...s, phase: s.quiz ? "feedback" : "answering",
      deadline: s.quiz ? now + 1500 : s.deadline, revision: s.revision + 1
    };
  }
  return s;
}
export function publicState(s: State) {
  const questions = s.questions.map(q => ({ prompt: q.prompt, options: q.options, ...(q.reading ? { reading: q.reading } : {}), ...(q.number ? { number: q.number } : {}) }));
  const q = s.questions[s.index];
  return {
    quiz: s.quiz, questions, answers: s.answers, index: s.index,
    phase: s.phase, deadline: s.deadline, serverNow: s.now, revision: s.revision,
    score: s.phase === "finished" ? score(s) : null,
    feedback: s.quiz && s.phase === "feedback"
      ? {
        answer: q.answer, explanation: q.explanation,
        correct: s.answers[s.index] === q.answer
      } : null
  };
}
export type PublicState = ReturnType<typeof publicState>;
