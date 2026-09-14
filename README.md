# T-Rex Edu

Giao diện học tiếng Anh bằng Next.js 16, React 19 và TypeScript. Thiết kế responsive với tiếng Việt, tông teal và bộ nhận diện T-Rex có sẵn.

## Chạy dự án

```bash
npm install
npm run dev
```

Mở http://localhost:3000. Kiểm tra bằng `npm run lint` và `npm run build`.

## Các màn hình

- `/`: trang chủ, thẻ từ tương tác, gợi ý học tiếp và mục tiêu hôm nay.
- `/decks`: tìm kiếm, lọc chủ đề/trình độ, lưu bộ từ và tạo bộ từ cá nhân.
- `/decks/[id]`: danh sách từ, phiên âm, nghĩa, ví dụ và thêm từ vào bộ cá nhân.
- `/decks/[id]/study`: lật flashcard, nghe phát âm nếu trình duyệt hỗ trợ, tự đánh giá ghi nhớ và hoàn thành phiên học.
- `/quiz`, `/quiz/[id]`: quiz tự tạo từ nội dung bộ từ, gồm cả bộ cá nhân.
- `/tests`, `/tests/[id]`: ba bài luyện tập A1–A2, chọn đáp án và xem giải thích.
- `/attempts/[id]`: điểm số, xem lại đáp án, lọc câu chưa đúng.
- `/dashboard`: thống kê thật từ hoạt động, biểu đồ bảy ngày, mục tiêu tùy chỉnh và lịch sử kết quả.
- `/login`, `/register`: giao diện tài khoản và luồng học thử bằng tên hiển thị.
- `/admin`: bản xem trước quản lý bộ từ cục bộ.

## Dữ liệu và giới hạn hiện tại

Bốn bộ từ có sẵn chứa 32 từ. Nội dung nằm trong `src/lib/learning-data.ts`.

Bộ từ cá nhân, từ đã nhớ, mục tiêu, tên học thử và kết quả được lưu bằng localStorage (`trex-learning-v1`), có kiểm tra cấu trúc bằng Zod. Dữ liệu chỉ có trên trình duyệt đã sử dụng, chưa đồng bộ thiết bị; xóa dữ liệu trình duyệt sẽ mất tiến độ. Biểu đồ đếm số từ khác nhau đã ôn mỗi ngày theo múi giờ thiết bị.

Xác thực, email khôi phục và quản trị máy chủ chưa được kết nối. Form tài khoản thông báo rõ trạng thái này, không gửi hay lưu mật khẩu. `/admin` là giao diện quản lý cục bộ, không phải khu vực đã được bảo vệ bằng quyền máy chủ. Schema Prisma và migration ban đầu đã có; phần Supabase Auth, truy vấn runtime và server actions vẫn cần tích hợp.

## Database Supabase / Prisma

Điền `DIRECT_URL` trong `.env` bằng Direct connection hoặc Session pooler cổng 5432, sau đó chạy:

```bash
npm run db:validate
npm run db:migrate
npm run db:generate
npm run db:status
```

Migration tạo 9 bảng ứng dụng và bật RLS; chưa seed dữ liệu hay kết nối giao diện. Chi tiết cấu trúc, quyền truy cập và cách xử lý lỗi nằm trong [prisma/README.md](prisma/README.md).

## Kiểm tra giao diện

Đã kiểm tra trên trình duyệt: trang chủ desktop; bố cục 390px và 320px; lật thẻ và lưu tiến độ; tạo bộ từ, thêm từ; tìm kiếm; làm bài test 4/5 câu; quiz từ bộ cá nhân; lọc đáp án sai; tải lại kết quả; và luồng học thử.
