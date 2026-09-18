# Quản trị T-Rex English

> Cập nhật: bộ từ và tiến độ của người đăng nhập hiện đồng bộ database; dashboard đã dùng dữ liệu tài khoản. Xem `DONG_BO_VA_VAN_HANH.md` cho thay đổi mới, thay cho mô tả luồng học thử cũ bên dưới.

## Truy cập

Đăng nhập bằng tài khoản có `profiles.role = ADMIN`, vào `/admin` hoặc **Tài khoản → Mở trang quản trị**. Người chưa đăng nhập được đưa về `/login`; người học vào đường dẫn admin được đưa về `/forbidden`. Mỗi trang và mỗi server action đều kiểm tra quyền riêng.

Tài khoản Supabase Auth mới chỉ trở thành hồ sơ trong ứng dụng sau khi đã xác nhận email và đăng nhập thành công. Trang tài khoản admin liệt kê các hồ sơ này; không phải danh sách email chưa xác nhận trong Supabase Auth.

## Admin đầu tiên

1. Đăng ký, xác nhận email và đăng nhập web một lần bằng tài khoản được chọn.
2. Trong Supabase Authentication → Users, sao chép UUID chính xác của tài khoản đó.
3. Mở `scripts/bootstrap-admin.sql`, thay UUID toàn số 0 bằng UUID vừa sao chép.
4. Chạy script trong Supabase SQL Editor. Script kiểm tra email đã xác nhận, hồ sơ có tồn tại và chưa có admin nào. Không chạy với UUID mẫu.
5. Tải lại `/account` rồi mở `/admin`. Các admin tiếp theo được cấp ở `/admin/users`.

Không dùng `user_metadata.role` hoặc sửa localStorage để cấp quyền. Script bootstrap chưa được tự chạy cho bất kỳ tài khoản thật nào.

## Các chức năng

| Trang | Thao tác |
|---|---|
| `/admin` | Tổng số tài khoản/admin, bộ từ/từ vựng, đề công khai, bài đã nộp; truy cập nhanh; đề cập nhật gần đây |
| `/admin/users` | Tìm theo tên hiển thị, lọc vai trò, phân trang; đổi LEARNER/ADMIN có xác nhận |
| `/admin/content?kind=deck` | Tìm tên/chủ đề, lọc công khai/riêng tư, phân trang bộ từ |
| `/admin/decks/new` | Tạo bộ từ, chọn tên/chủ đề/trình độ/màu/ký hiệu/mô tả, nhập từ/phiên âm/nghĩa/ví dụ |
| `/admin/decks/[id]` | Sửa, thêm/bỏ/đổi thứ tự từ; công khai hoặc chuyển riêng tư; xóa bộ từ |
| `/admin/content?kind=test` | Tìm, lọc, phân trang đề kiểm tra |
| `/admin/tests/new` và `/admin/tests/[id]` | Soạn/sửa/xóa đề; thời lượng 1–180 phút; câu hỏi, 4 lựa chọn khác nhau, một đáp án đúng, giải thích; đổi thứ tự; bản nháp/công khai |
| `/admin/attempts` | Tìm người học/tên bài, lọc QUIZ/TEST, phân trang kết quả từ database |
| `/admin/attempts/[id]` | Xem câu hỏi gốc, lựa chọn của người học, đáp án đúng và giải thích của bài đã nộp |

Mỗi bộ từ/đề hỗ trợ tối đa 100 mục. Bản nháp được phép chưa có từ/câu hỏi; khi công khai phải có ít nhất một mục. Tên và chủ đề vẫn bắt buộc. Câu hỏi đã thêm phải được điền đủ nội dung trước khi lưu.

Hệ thống hiện quản lý **hồ sơ và phân quyền** trong ứng dụng. Thao tác quản trị Supabase Auth như xóa tài khoản, đổi email hoặc khóa người dùng được thực hiện trong Supabase Dashboard; không có nút giả cho các thao tác này trên web.

## Dữ liệu được hiển thị cho người học

- Trang chủ/thư viện flashcard/quiz lấy bộ từ PUBLIC từ database. Bộ từ riêng tư không được đưa vào danh mục chung.
- Trang `/tests` chỉ lấy metadata và số câu của đề `published = true`. Đáp án không được gửi cùng danh mục hoặc trang giới thiệu đề.
- Test công khai bắt đầu một phiên server ở `/sessions/[id]`; thời gian được kiểm tra phía server, đáp án chỉ được xem sau khi nộp/hết giờ.
- Quiz của bộ từ công khai dùng cùng cơ chế: mỗi câu 10 giây, phản hồi 1,5 giây, tự chuyển câu, lưu điểm. Cần có ít nhất 4 nghĩa khác nhau trong nguồn từ được phép truy cập để tạo đủ lựa chọn.
- Phiên đã bắt đầu giữ bản chụp nội dung. Sửa/ẩn/xóa đề không thay đổi câu hỏi của phiên đang làm hoặc kết quả đã nộp.
- Bộ từ tự tạo và tiến độ flashcard học thử vẫn ở `trex-learning-v1` trong localStorage. Quiz từ bộ chỉ tồn tại trong trình duyệt vẫn dùng luồng học thử cũ. Những dữ liệu này chưa tự nhập vào database và không xuất hiện trong báo cáo admin.
- Dashboard người học hiện vẫn thống kê lịch sử cục bộ. Kết quả quiz/test server được lưu trong database và xem bằng liên kết kết quả sau khi nộp; admin xem được trong mục kết quả học tập.

## Quy tắc bảo vệ dữ liệu

`src/lib/content-schema.ts` dùng Zod kiểm tra dữ liệu ở client và server. Giới hạn độ dài và số mục tránh payload không hợp lệ; lựa chọn câu hỏi không được trùng nhau; ID từ không được trùng trong một bộ.

`src/actions/content.ts` xác thực người gọi rồi đọc lại vai trò trong transaction. Khóa advisory chung với `src/actions/admin.ts` tuần tự hóa sửa nội dung/đổi quyền, tránh admin đã bị thu hồi quyền vẫn ghi dữ liệu. Client không thể tự gửi vai trò để vượt kiểm tra.

Khi sửa hoặc xóa, client gửi thời điểm `updatedAt` ban đầu. Nếu bản ghi đã thay đổi, server từ chối và yêu cầu tải lại; nội dung đang gõ được giữ để người dùng tự sao chép. Transaction bảo đảm việc lưu tiêu đề và toàn bộ từ/câu hỏi thành công cùng nhau.

Các từ còn giữ lại được upsert bằng ID cũ nên không mất tiến độ. Bỏ từ hoặc xóa bộ từ sẽ cascade tiến độ/lượt lưu liên quan: giao diện yêu cầu xác nhận. Kết quả bài đã nộp dùng snapshot và FK `SET NULL`, nên vẫn tồn tại sau khi nguồn bị xóa.

Admin không thể tự đổi quyền; đổi quyền người khác cũng kiểm tra vai trò hiện tại so với phiên bản form. Điều này cùng khóa transaction ngăn hai admin đồng thời hạ quyền nhau để hệ thống mất hết admin.

## File chính và vai trò

- `src/app/admin/layout.tsx`, `admin.css`: kiểm tra quyền, thanh điều hướng và bố cục responsive.
- `src/app/admin/**/page.tsx`: đọc dữ liệu có quyền, tìm kiếm và phân trang; không gửi toàn bộ database sang client.
- `src/components/content-editor.tsx`: form nội dung có thêm/bỏ/đổi thứ tự, trạng thái đang lưu, thông báo lỗi và cảnh báo rời trang khi chưa lưu.
- `src/components/role-form.tsx`, `src/actions/admin.ts`: giao diện và transaction đổi vai trò.
- `src/lib/catalog.ts`, `src/components/learning-provider.tsx`: đưa bộ từ công khai từ database vào thư viện hiện có.
- `src/lib/session-engine.ts`, `src/actions/attempts.ts`: kiểm tra thời gian, revision, quyền sở hữu phiên; lưu kết quả trên server.
- `src/components/start-button.tsx`, `src/components/session-player.tsx`: bắt đầu, đồng bộ và hiển thị bài làm.
- `scripts/test-admin.cjs`, `scripts/test-auth.cjs`, `scripts/test-logic.cjs`: kiểm thử mà không cần gửi email hoặc tạo tài khoản thật.

## Chạy và kiểm tra

```powershell
npm run db:migrate
npm run db:generate
npm run test:admin
npm run test:auth
npm run test:logic
npm run lint
npm run build -- --webpack
npm run dev
```

Ngày 15/09/2026: migration `20260915000000_learning_sessions` đã được áp dụng thành công lên Supabase đang cấu hình trong dự án. Kiểm thử database bằng transaction rồi ROLLBACK xác nhận bảng phiên, đáp án -1, cascade tiến độ và giữ kết quả sau xóa nguồn. Không còn dữ liệu QA từ lần kiểm thử này.

30 bài kiểm thử Auth/admin/session-action và các assertion session engine đã qua. Kiểm tra trực quan dùng component thật với dữ liệu minh họa ở desktop và 390px, không tạo cửa hậu admin trong ứng dụng. Trình duyệt thật đã kiểm tra guest bị chuyển khỏi `/admin` và danh mục đề công khai từ Supabase. Cần phiên đăng nhập ADMIN thật để kiểm tra click-through CRUD/đổi quyền trong môi trường của bạn; không tự cấp quyền cho một tài khoản chưa được chỉ định.
