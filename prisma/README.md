# Database T-Rex English

Schema dành cho Prisma 7 và PostgreSQL/Supabase. Migration đầu tiên tạo 9 bảng ứng dụng trong `public`; migration bổ sung tạo bảng `learning_sessions`. Không tạo hoặc sửa schema `auth` của Supabase.

## Kiểm tra và áp dụng migration

Điền `DIRECT_URL` trong `.env` ở thư mục gốc bằng URI Direct connection hoặc Session pooler (cổng 5432) sao chép từ Supabase Connect. Nếu máy không truy cập được IPv6, dùng Session pooler. `DATABASE_URL` dành cho kết nối runtime sau này; Prisma CLI hiện đọc `DIRECT_URL` qua `prisma.config.ts`.

Chạy tại thư mục gốc dự án:

```powershell
npm run db:validate
npm run db:generate
npm run db:status
npm run db:migrate
npm run db:status
```

`db:migrate` chạy `prisma migrate deploy`, áp dụng migration SQL đã có và không cần shadow database. Lệnh này thay đổi database được chỉ định bởi `DIRECT_URL`. Migration đầu tiên dành cho database chưa có các bảng ứng dụng trùng tên; nếu đã có dữ liệu/bảng cùng tên, cần đối chiếu và baseline trước, không reset database.

Nếu migration khởi tạo đã được áp dụng, chỉ migration `20260915000000_learning_sessions` còn cần áp dụng. Migration bổ sung tạo bảng lưu phiên làm bài, bật RLS và cập nhật CHECK của `attempts` để chấp nhận `-1` cho câu bỏ trống. Không sửa lại migration đầu tiên đã chạy. Kiểm tra đúng database đích và sao lưu phù hợp trước khi áp dụng vào dữ liệu đang dùng.

`db:generate` chỉ sinh Prisma Client ở `src/generated/prisma`; không tạo bảng và không nhập dữ liệu. Helper `src/lib/db.ts` dùng `DATABASE_URL`, chỉ được import phía server và tái sử dụng client khi phát triển.

Kết quả mong đợi: `All migrations have been successfully applied.` và `Database schema is up to date!`. Trong Supabase Table Editor, chọn schema `public` để kiểm tra các bảng.

Không dùng `prisma db push` thay thế: các CHECK constraint và RLS nằm trong SQL migration. Những migration phát triển tiếp theo có thể được tạo bằng `prisma migrate dev --name ...` trên database phát triển với shadow database riêng. `migrate deploy` chỉ áp dụng SQL có sẵn, không tự tạo migration cho thay đổi schema mới.

## Các bảng và quy ước

| Model / bảng | Nội dung |
| --- | --- |
| Profile / profiles | UUID của Supabase Auth, tên hiển thị, vai trò, mục tiêu 5–30 từ/ngày, múi giờ |
| Deck / decks | Bộ từ hệ thống hoặc cá nhân, chủ sở hữu, trạng thái public/private |
| Word / words | Từ, phiên âm, nghĩa, ví dụ, thứ tự trong bộ |
| SavedDeck / saved_decks | Bộ từ người học đã lưu, không trùng theo người và bộ |
| WordProgress / word_progress | Trạng thái nhớ và lần ôn gần nhất theo người và từ |
| DailyWordActivity / daily_word_activity | Mỗi từ chỉ được đếm một lần trong ngày địa phương của người học |
| Test / tests | Bài kiểm tra, trình độ, thời lượng và trạng thái xuất bản |
| TestQuestion / test_questions | Câu hỏi, lựa chọn, chỉ số đáp án từ 0 và giải thích |
| Attempt / attempts | Kết quả quiz/test, số câu đúng, lựa chọn và bản chụp câu hỏi |
| LearningSession / learning_sessions | Chủ phiên, loại bài, nguồn, tiêu đề và JSON trạng thái của bài đang làm |

- `Profile.id` phải lấy từ user Supabase đã xác thực, không tự sinh và không nhận tùy ý từ trình duyệt. Schema này chưa có foreign key/trigger đến `auth.users`; backend tích hợp sau cần đồng bộ tạo/xóa profile theo tài khoản. Mật khẩu do Supabase Auth quản lý.
- ID của deck/test dùng text để giữ các slug hiện tại như `everyday`, `basics`. Word dùng khóa ghép `(deckId, id)` vì ID từ mẫu như `1` lặp giữa các bộ.
- Bộ từ hệ thống: `ownerId = null`, `visibility = PUBLIC`. Bộ cá nhân có `ownerId`; mặc định `PRIVATE`. Frontend có thể suy ra `custom` từ chủ sở hữu.
- `Attempt.score` là số câu đúng, không phải phần trăm. `questions` lưu JSON dạng `[{ prompt, options, answer, explanation }]`, `answers` lưu chỉ số lựa chọn từ 0, hoặc `-1` cho câu bỏ trống. Backend phải kiểm tra cấu trúc từng câu, phạm vi lựa chọn và tính điểm từ nội dung tin cậy.
- `Attempt.completedAt` tương ứng trường `date` trên giao diện. Bản chụp câu hỏi giữ nguyên khi nội dung gốc thay đổi; xóa bộ/test chỉ xóa liên kết nguồn của kết quả.
- `DailyWordActivity.day` là ngày địa phương của người học, lưu kiểu SQL DATE; backend phải tính theo múi giờ đã chọn, không cắt ngày UTC. Xóa từ/bộ từ sẽ xóa tiến độ và hoạt động liên quan; xóa profile sẽ xóa dữ liệu cá nhân liên quan.
- Timestamp `updatedAt` và ID `uuid()` được Prisma Client điền khi tạo bản ghi; nếu nhập bằng SQL/Table Editor, cần tự cung cấp các trường này.
- `LearningSession.state` giữ snapshot câu hỏi, lựa chọn, thời hạn, phase và revision theo bộ hướng dẫn. Database kiểm tra đây là JSON object; session engine phía server phải kiểm tra nội dung chi tiết. `sourceId` giữ dạng text và không có foreign key để phiên vẫn giữ snapshot khi nội dung gốc bị xóa.

## Nhập dữ liệu mẫu

```powershell
npm run db:seed
```

Lệnh chạy `scripts/seed.cjs`, đọc `prisma/seed-data.ts` và dùng `DIRECT_URL`. Nguồn mẫu có 4 bộ, 32 từ, 3 bài test và 15 câu hỏi. Script chạy trong transaction và dùng advisory lock để hai lượt seed không ghi chồng nhau. Nếu ID bộ hoặc đề đã tồn tại, script bỏ qua cả nhóm đó, giữ nguyên nội dung bạn đã sửa; không tự bổ sung các câu con còn thiếu của nhóm đã có.

Lỗi trong quá trình nhập làm transaction rollback. Script không sửa dữ liệu học cá nhân, không cấp admin và không đọc localStorage. Không chạy seed ở bước build hoặc mỗi lần server khởi động. Thiếu `DIRECT_URL` thì script dừng, không dùng cấu hình kết nối mặc định của máy. Log lỗi không in mật khẩu hoặc connection string.

## Phạm vi hiện tại

Mã phần Database đã được triển khai theo Word. Việc viết mã không đồng nghĩa migration mới và seed đã chạy trên Supabase. Website vẫn dùng luồng học thử hiện có cho đến khi hoàn thiện Auth và các Server Actions; không tự đồng bộ dữ liệu localStorage chỉ nhờ thêm schema.

Sau khi áp dụng cả hai migration, SQL bật RLS cho toàn bộ 10 bảng, chưa mở policy cho `anon`/`authenticated`. Vì vậy publishable key chưa đọc/ghi được các bảng này. Khi tích hợp backend, phải kiểm tra quyền từng thao tác qua Prisma (kết nối đặc quyền có thể bỏ qua RLS), hoặc bổ sung policy tương ứng khi dùng Supabase Data API. Không trả đáp án bài kiểm tra cho client trước khi chấm; chỉ backend được sửa vai trò admin.

## Lỗi kết nối

- `P1000`/authentication failed: kiểm tra username và mật khẩu database trong URI.
- `P1001`/không tới được máy chủ: kiểm tra project đang hoạt động, hostname, mạng; dùng Session pooler 5432 nếu Direct bị giới hạn IPv6.
- URI không hợp lệ: mỗi biến `.env` nằm trên một dòng, không có Markdown hay dấu gạch chéo ngược. `@` trong mật khẩu mã hóa thành `%40`; giữ nguyên `%40` nếu đã mã hóa, không mã hóa lần hai.
- Báo bảng đã tồn tại: kiểm tra database đích và lịch sử migration trước khi chạy lại; không dùng `migrate reset` trên dữ liệu cần giữ.
