import type { Reading } from "@/lib/reading";
export type Word = { id: string; term: string; phonetic: string; meaning: string; example: string };
export type Deck = { id: string; title: string; description: string; category: string; level: string; color: string; symbol: string; words: Word[]; custom?: boolean };
export type Question = { reading?: Reading | null; number?: number | null; prompt: string; options: string[]; answer: number; explanation: string };
export type Attempt = { id: string; title: string; date: string; questions: Question[]; answers: number[]; score: number };
const words = (rows: string[][]): Word[] => rows.map(([term, phonetic, meaning, example], i) => ({ id: String(i + 1), term, phonetic, meaning, example }));
export const starterDecks: Deck[] = [
  { id: "everyday", title: "Everyday essentials", description: "Những từ quen thuộc, cho mỗi ngày tự tin hơn.", category: "Giao tiếp", level: "A1", color: "blue", symbol: "Aa", words: words([
    ["hello", "/həˈləʊ/", "xin chào", "Hello! It is nice to meet you."], ["morning", "/ˈmɔːnɪŋ/", "buổi sáng", "I go for a walk every morning."], ["friend", "/frend/", "người bạn", "My best friend lives nearby."], ["happy", "/ˈhæpi/", "vui vẻ", "I am happy to see you."], ["learn", "/lɜːn/", "học", "We learn something new every day."], ["family", "/ˈfæməli/", "gia đình", "I love spending time with my family."], ["home", "/həʊm/", "nhà", "Let's go home."], ["beautiful", "/ˈbjuːtɪfəl/", "đẹp", "What a beautiful day!"], ["thank you", "/ˈθæŋk juː/", "cảm ơn", "Thank you for your help."], ["together", "/təˈɡeðə/", "cùng nhau", "We can learn English together."]
  ]) },
  { id: "food", title: "Food & drinks", description: "Gọi món yêu thích bằng tiếng Anh, thật dễ dàng.", category: "Đời sống", level: "A1", color: "peach", symbol: "Ff", words: words([
    ["breakfast", "/ˈbrekfəst/", "bữa sáng", "I have breakfast at seven."], ["delicious", "/dɪˈlɪʃəs/", "ngon", "This soup is delicious."], ["coffee", "/ˈkɒfi/", "cà phê", "I'd like a cup of coffee."], ["water", "/ˈwɔːtə/", "nước", "May I have some water?"], ["vegetable", "/ˈvedʒtəbl/", "rau củ", "Carrots are my favourite vegetable."], ["menu", "/ˈmenjuː/", "thực đơn", "Could I see the menu, please?"], ["hungry", "/ˈhʌŋɡri/", "đói", "I'm hungry. Let's eat!"], ["dinner", "/ˈdɪnə/", "bữa tối", "We cook dinner together."]
  ]) },
  { id: "travel", title: "Travel & discover", description: "Mang theo tiếng Anh trên mỗi chuyến đi.", category: "Du lịch", level: "A2", color: "green", symbol: "Tt", words: words([
    ["journey", "/ˈdʒɜːni/", "hành trình", "Our journey begins today."], ["airport", "/ˈeəpɔːt/", "sân bay", "We arrived at the airport early."], ["ticket", "/ˈtɪkɪt/", "vé", "I'd like a return ticket."], ["discover", "/dɪˈskʌvə/", "khám phá", "Let's discover a new city."], ["luggage", "/ˈlʌɡɪdʒ/", "hành lý", "Where can I leave my luggage?"], ["destination", "/ˌdestɪˈneɪʃn/", "điểm đến", "Our destination is London."], ["passport", "/ˈpɑːspɔːt/", "hộ chiếu", "Please show your passport."], ["explore", "/ɪkˈsplɔː/", "thám hiểm, khám phá", "We want to explore the island."]
  ]) },
  { id: "work", title: "At work", description: "Từng bước tự tin trong môi trường công sở.", category: "Công việc", level: "A2", color: "lilac", symbol: "Ww", words: words([
    ["meeting", "/ˈmiːtɪŋ/", "cuộc họp", "The meeting starts at nine."], ["deadline", "/ˈdedlaɪn/", "hạn chót", "The deadline is next Friday."], ["colleague", "/ˈkɒliːɡ/", "đồng nghiệp", "My colleague is very helpful."], ["project", "/ˈprɒdʒekt/", "dự án", "We are working on a new project."], ["schedule", "/ˈʃedjuːl/", "lịch trình", "Let me check my schedule."], ["achieve", "/əˈtʃiːv/", "đạt được", "Together we can achieve our goals."]
  ]) },
];
export const tests: { id: string; title: string; description: string; level: string; category: string; minutes: number; color: string; questions: Question[] }[] = [
  { id: "basics", title: "English, the basics", description: "Khởi động nhẹ nhàng với ngữ pháp và giao tiếp cơ bản.", level: "A1", category: "Ngữ pháp", minutes: 5, color: "blue", questions: [
    { prompt: "She ___ a student.", options: ["am", "is", "are", "be"], answer: 1, explanation: "Chủ ngữ 'she' đi với động từ 'is' ở thì hiện tại đơn." },
    { prompt: "I have ___ apple in my bag.", options: ["a", "the", "an", "many"], answer: 2, explanation: "Dùng 'an' trước danh từ số ít bắt đầu bằng âm nguyên âm: an apple." },
    { prompt: "They ___ football every Sunday.", options: ["plays", "playing", "played", "play"], answer: 3, explanation: "Với 'they', dùng động từ nguyên mẫu 'play' ở thì hiện tại đơn." },
    { prompt: "How ___ water do you need?", options: ["much", "many", "few", "any"], answer: 0, explanation: "Water là danh từ không đếm được nên dùng 'how much'." },
    { prompt: "Choose the correct response: 'Nice to meet you!'", options: ["I'm twelve.", "It's Monday.", "Nice to meet you, too!", "Yes, I can."], answer: 2, explanation: "'Nice to meet you, too!' là cách đáp lại khi được chào làm quen." }
  ] },
  { id: "daily", title: "A little everyday English", description: "Đặt tiếng Anh vào những tình huống quen thuộc.", level: "A1", category: "Giao tiếp", minutes: 5, color: "peach", questions: [
    { prompt: "You want to order a coffee. What do you say?", options: ["I'd like a coffee, please.", "I coffee like.", "Coffee is you.", "You must coffee."], answer: 0, explanation: "'I'd like ..., please' là mẫu câu gọi món lịch sự." },
    { prompt: "'How are you?' — '___'", options: ["At home.", "I'm fine, thanks.", "By bus.", "At five."], answer: 1, explanation: "Câu hỏi 'How are you?' hỏi thăm tình trạng, sức khỏe." },
    { prompt: "Which phrase asks for directions?", options: ["How old are you?", "What's your name?", "Where is the station?", "How much is it?"], answer: 2, explanation: "'Where is ...?' được dùng để hỏi vị trí hoặc đường đi." },
    { prompt: "Someone says 'Thank you'. You reply:", options: ["Good night.", "I'm sorry.", "See you.", "You're welcome."], answer: 3, explanation: "'You're welcome' có nghĩa là 'Không có gì', dùng để đáp lại lời cảm ơn." },
    { prompt: "You accidentally step on someone's foot. You say:", options: ["Congratulations!", "I'm sorry!", "Welcome!", "Good luck!"], answer: 1, explanation: "'I'm sorry' là lời xin lỗi khi bạn làm phiền người khác." }
  ] },
  { id: "next-step", title: "Ready for the next step?", description: "Thử sức với thì quá khứ, so sánh và câu điều kiện.", level: "A2", category: "Ngữ pháp", minutes: 7, color: "green", questions: [
    { prompt: "We ___ to the beach yesterday.", options: ["go", "gone", "went", "going"], answer: 2, explanation: "Yesterday chỉ quá khứ. Quá khứ đơn của 'go' là 'went'." },
    { prompt: "This book is ___ than that one.", options: ["interesting", "more interesting", "most interesting", "interest"], answer: 1, explanation: "So sánh hơn của tính từ dài: more + adjective + than." },
    { prompt: "If it rains, we ___ at home.", options: ["stayed", "staying", "would stayed", "will stay"], answer: 3, explanation: "Điều kiện loại 1: If + hiện tại đơn, will + động từ nguyên mẫu." },
    { prompt: "I have lived here ___ 2020.", options: ["since", "for", "during", "at"], answer: 0, explanation: "Dùng 'since' với một mốc thời gian, 'for' với một khoảng thời gian." },
    { prompt: "She ___ dinner when I called.", options: ["cooks", "was cooking", "has cooked", "cook"], answer: 1, explanation: "Quá khứ tiếp diễn diễn tả hành động đang xảy ra khi một hành động khác xen vào." }
  ] }
];
export function makeQuiz(deck: Deck): Question[] {
  return deck.words.map((word, index) => {
    const alternatives = [...new Set([...deck.words, ...starterDecks.flatMap(d => d.words)].map(w => w.meaning))].filter(m => m !== word.meaning).slice(0, 3);
    const answer = index % 4;
    alternatives.splice(answer, 0, word.meaning);
    return { prompt: `“${word.term}” có nghĩa là gì?`, options: alternatives, answer, explanation: `${word.term}: ${word.meaning}.${word.example ? ` Ví dụ: ${word.example}` : ""}` };
  });
}
