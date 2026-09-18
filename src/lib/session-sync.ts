import type { Command, PublicState } from "@/lib/session-engine";

export type SessionView = {
  state: PublicState | null;
  answers: number[];
  saving: boolean;
  submitting: boolean;
  error: string;
};
type Work = { type: "poll" | "submit" } | { type: "activate"; index: number } | { type: "select"; index: number; option: number };

// Serialize writes against the latest server revision while showing queued choices immediately.
export function createSessionSync(execute: (command: Command) => Promise<PublicState>, notify: (view: SessionView) => void) {
  let state: PublicState | null = null, active: Work | null = null, queue: Work[] = [];
  let error = "", disposed = false;
  const failedSelections = new Map<number, string>();
  function saving() { return (active !== null && active.type !== "poll") || queue.some(work => work.type !== "poll"); }
  function publish() {
    if (disposed) return;
    const starting = state?.quiz && state.phase === "ready" && [active,...queue].some(work=>work?.type === "activate");
    const visibleState = starting ? { ...state!, phase: "answering" as const, deadline: state!.serverNow + 10000 } : state;
    const answers = [...(state?.answers ?? [])];
    for (const work of [active, ...queue]) {
      if (work?.type === "select" && visibleState?.phase === "answering") answers[work.index] = work.option;
    }
    notify({ state: visibleState, answers, saving: active?.type === "select" || active?.type === "submit" || queue.some(work=>work.type === "select" || work.type === "submit"), submitting: active?.type === "submit" || queue.some(work => work.type === "submit"), error: [...failedSelections.values(), error].filter(Boolean).join(" ") });
  }
  async function drain() {
    if (disposed || active || queue.length === 0) return;
    const work = queue.shift()!;
    if (work.type !== "poll" && !(work.type === "activate" ? state?.phase === "ready" : state?.phase === "answering")) { queue = []; publish(); return; }
    active = work;
    publish();
    try {
      const next = await execute({ ...work, revision: state?.revision ?? 0 });
      if (disposed) return;
      const firstResponse = !state;
      state = next;
      if (firstResponse || work.type === "poll") error = "";
      if (work.type === "select") {
        if (next.answers[work.index] === work.option) failedSelections.delete(work.index);
        else failedSelections.set(work.index, `Chưa lưu lựa chọn câu ${next.questions[work.index]?.number ?? work.index + 1}: bài đã hết giờ hoặc thay đổi ở tab khác. Hãy kiểm tra và chọn lại.`);
      }
      if (work.type === "submit" && next.phase !== "finished") error = "Bài vừa thay đổi ở tab khác. Kiểm tra đáp án rồi nhấn Nộp bài lại.";
      if (next.phase !== "answering") queue = [];
      if (next.quiz && next.phase === "ready") queue.push({ type: "activate", index: next.index });
    } catch {
      if (work.type === "select") failedSelections.set(work.index, `Chưa lưu được lựa chọn câu ${state?.questions[work.index]?.number ?? work.index + 1}. Đã khôi phục đáp án được xác nhận gần nhất; hãy chọn lại khi có kết nối.`);
      else error = work.type === "submit" ? "Chưa xác nhận được việc nộp bài. Hãy kiểm tra kết nối rồi thử lại."
        : "Chưa kết nối được máy chủ. Thời gian vẫn tiếp tục tính; hãy kiểm tra kết nối.";
      // Don't silently discard other selections or replay the failed choice.
    } finally {
      active = null;
      publish();
      void drain();
    }
  }
  return {
    poll() {
      if (disposed || active || queue.length || state?.phase === "finished") return;
      queue.push({ type: "poll" }); void drain();
    },
    select(index: number, option: number) {
      const starting = state?.quiz && state.phase === "ready" && active?.type === "activate";
      const selecting = active?.type === "select" || queue.some(work=>work.type === "select");
      if (disposed || active?.type === "submit" || queue.some(work => work.type === "submit") || (!starting && state?.phase !== "answering") || !state || (state.quiz && (selecting || index !== state.index)) ||
        !Number.isInteger(index) || !Number.isInteger(option) || index < 0 || index >= state.questions.length || option < 0 || option >= state.questions[index].options.length) return;
      error = "";
      // A later click replaces an unsent choice for the same question.
      queue = queue.filter(work => work.type !== "select" || work.index !== index);
      queue.push({ type: "select", index, option }); publish(); void drain();
    },
    submit() {
      if (disposed || saving() || state?.phase !== "answering" || state.quiz) return;
      error = ""; queue.push({ type: "submit" }); publish(); void drain();
    },
    isSaving: saving,
    dispose() { disposed = true; queue = []; },
  };
}
