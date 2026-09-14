"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { z } from "zod";
import { starterDecks, type Attempt, type Deck } from "@/lib/learning-data";

const wordSchema = z.object({ id: z.string(), term: z.string(), phonetic: z.string(), meaning: z.string(), example: z.string() });
const schema = z.object({
  name: z.string(), goal: z.number().int().min(5).max(30),
  customDecks: z.array(z.object({ id: z.string(), title: z.string(), description: z.string(), category: z.string(), level: z.string(), color: z.string(), symbol: z.string(), custom: z.boolean().optional(), words: z.array(wordSchema) })),
  known: z.record(z.string(), z.array(z.string())), saved: z.array(z.string()),
  activity: z.record(z.string(), z.array(z.string())),
  attempts: z.array(z.object({ id: z.string(), title: z.string(), date: z.string(), score: z.number(), answers: z.array(z.number()), questions: z.array(z.object({ prompt: z.string(), options: z.array(z.string()), answer: z.number(), explanation: z.string() })) })),
});
type LearningState = z.infer<typeof schema>;
const initial: LearningState = { name: "", goal: 10, customDecks: [], known: {}, saved: [], activity: {}, attempts: [] };
const serverSnapshot = { state: initial, ready: false, storageError: false };
let snapshot = serverSnapshot;
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!snapshot.ready) {
    let state = initial; let storageError = false;
    try {
      const raw = localStorage.getItem("trex-learning-v1");
      if (raw) { const parsed = schema.safeParse(JSON.parse(raw)); if (parsed.success) state = parsed.data; else storageError = true; }
    } catch { storageError = true; }
    snapshot = { state, ready: true, storageError };
  }
  return () => { listeners.delete(listener); };
}
function update(fn: (s: LearningState) => LearningState) {
  const state = fn(snapshot.state); let storageError = false;
  try { localStorage.setItem("trex-learning-v1", JSON.stringify(state)); } catch { storageError = true; }
  snapshot = { state, ready: true, storageError };
  listeners.forEach(listener => listener());
}
export function dayKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
type LearningContext = { state: LearningState; ready: boolean; decks: Deck[]; update: (fn: (s: LearningState) => LearningState) => void; markWord: (deckId: string, wordId: string, known: boolean) => void; addAttempt: (attempt: Attempt) => void };
const Context = createContext<LearningContext | null>(null);
export function LearningProvider({ children }: { children: ReactNode }) {
  const { state, ready, storageError } = useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);
  function markWord(deckId: string, wordId: string, known: boolean) {
    update(s => ({ ...s, known: { ...s.known, [deckId]: known ? [...new Set([...(s.known[deckId] || []), wordId])] : (s.known[deckId] || []).filter(id => id !== wordId) }, activity: { ...s.activity, [dayKey()]: [...new Set([...(s.activity[dayKey()] || []), `${deckId}:${wordId}`])] } }));
  }
  return <Context.Provider value={{ state, ready, decks: [...starterDecks, ...state.customDecks], update, markWord, addAttempt: attempt => update(s => ({ ...s, attempts: [attempt, ...s.attempts] })) }}>{storageError && <div className="storage-notice" role="status">Trình duyệt chưa thể lưu dữ liệu. Tiến độ hiện tại chỉ được giữ trong phiên này.</div>}{children}</Context.Provider>;
}
export function useLearning() { const value = useContext(Context); if (!value) throw new Error("Missing LearningProvider"); return value; }
