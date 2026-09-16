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
- `/tests`, `/tests/[id]`: đề công khai từ database; đếm ngược phía server, nộp bài rồi mới xem đáp án.
- `/attempts/[id]`: điểm số, xem lại đáp án, lọc câu chưa đúng.
- `/dashboard`: thống kê thật từ hoạt động, biểu đồ bảy ngày, mục tiêu tùy chỉnh và lịch sử kết quả.
- `/login`, `/register`: đăng ký, xác nhận email và đăng nhập Supabase Auth.
- `/admin`: thống kê database, quản lý bộ từ/đề/câu hỏi, phân quyền và xem kết quả. Xem [hướng dẫn quản trị](docs/QUAN_TRI.md).

## Dữ liệu và giới hạn hiện tại

Thư viện công khai lấy từ Supabase. Bộ seed ban đầu gồm 4 bộ từ (32 từ) và 3 đề; admin có thể sửa, thêm, ẩn hoặc xóa trên web.

Bộ từ cá nhân, từ đã nhớ, mục tiêu, tên học thử và kết quả được lưu bằng localStorage (`trex-learning-v1`), có kiểm tra cấu trúc bằng Zod. Dữ liệu chỉ có trên trình duyệt đã sử dụng, chưa đồng bộ thiết bị; xóa dữ liệu trình duyệt sẽ mất tiến độ. Biểu đồ đếm số từ khác nhau đã ôn mỗi ngày theo múi giờ thiết bị.

Đăng ký, xác nhận email, đăng nhập, đăng xuất và khôi phục mật khẩu đã kết nối Supabase Auth. Header lấy danh tính từ phiên server; `/account` yêu cầu đăng nhập và `/admin` yêu cầu vai trò ADMIN. Admin đã quản lý nội dung trên database, có tìm kiếm/phân trang, xác nhận xóa và bảo vệ khỏi ghi đè bản sửa mới hơn. Xem [hướng dẫn Auth](docs/DANG_KY_DANG_NHAP.md) để cấu hình email và kiểm tra luồng thật. Chạy `npm run test:auth` để kiểm thử các luồng Auth bằng dịch vụ mô phỏng.

## Database Supabase / Prisma

Điền `DIRECT_URL` trong `.env` bằng Direct connection hoặc Session pooler cổng 5432, sau đó chạy:

```bash
npm run db:validate
npm run db:migrate
npm run db:generate
npm run db:status
```

Migration khởi tạo tạo 9 bảng; migration bổ sung thêm bảng phiên học và quy ước đáp án bỏ trống. Đã có script seed và kết nối Prisma cho hồ sơ Auth. Danh mục công khai và phiên quiz/test dùng database; bộ từ cá nhân học thử và tiến độ flashcard vẫn dùng trình duyệt. Chi tiết cấu trúc, quyền truy cập và cách xử lý lỗi nằm trong [prisma/README.md](prisma/README.md).

## Kiểm tra giao diện

Đã kiểm tra trên trình duyệt: trang chủ desktop; bố cục 390px và 320px; lật thẻ và lưu tiến độ; tạo bộ từ, thêm từ; tìm kiếm; làm bài test 4/5 câu; quiz từ bộ cá nhân; lọc đáp án sai; tải lại kết quả; và luồng học thử.

## Admin và phiên làm bài trên server

Xem [docs/QUAN_TRI.md](docs/QUAN_TRI.md) để cấp admin đầu tiên, soạn nội dung và hiểu quy tắc xóa dữ liệu. Script `scripts/bootstrap-admin.sql` yêu cầu một UUID Auth đã xác thực và có hồ sơ trong ứng dụng; không tự chạy với UUID mẫu.

Quiz từ bộ công khai: 5 giây/câu, phản hồi 1,5 giây, tự chuyển câu và lưu điểm. Test: thời lượng do admin cấu hình, không gửi đáp án xuống client khi đang làm. Cả hai yêu cầu đăng nhập và dùng `/sessions/[id]`; bài nộp nằm trong database. Dashboard học thử vẫn thống kê dữ liệu cục bộ, không tự gộp lịch sử server.

```bash
npm run test:admin
npm run test:auth
npm run test:logic
npm run lint
npm run build -- --webpack
```

Kiểm tra ngày 15/09/2026: 30 test Auth/admin/session-action và các assertion bộ đếm thời gian đã qua; kiểm tra ràng buộc Supabase bằng transaction rollback. Giao diện admin được kiểm tra desktop/390px bằng dữ liệu minh họa; CRUD bằng phiên ADMIN thật cần tài khoản có quyền. Migration phiên làm bài đã áp dụng lên Supabase của dự án.

## Đăng nhập Google

Đã có nút **Tiếp tục với Google** ở đăng nhập/đăng ký và callback PKCE. Google provider của Supabase cần được bật với OAuth Client ID/Client Secret trước khi dùng thật. Xem [DANG_NHAP_GOOGLE.md](docs/DANG_NHAP_GOOGLE.md) để điền đúng callback và cấu hình dịch vụ. Không cần migration mới.
