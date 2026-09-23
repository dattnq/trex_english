# Đăng ký và đăng nhập T Rex English

## Đã triển khai

- Đăng ký email và mật khẩu; kiểm tra tên, định dạng email và hai mật khẩu.
- Mật khẩu được giữ nguyên, không trim khoảng trắng; tên và email được chuẩn hóa.
- Supabase Auth xử lý mật khẩu. Profile chỉ được tạo cho email đã xác nhận và luôn bắt đầu với LEARNER; không nhận role từ form hoặc metadata.
- Callback xác nhận hỗ trợ cả `token_hash` từ mẫu email tùy chỉnh và `code` của PKCE. Điểm đến chỉ là account hoặc reset-password, không chuyển tới URL tùy ý.
- Đăng nhập, cookie SSR, proxy làm mới phiên, trang tài khoản có bảo vệ và đăng xuất.
- Gửi lại xác nhận email; quên mật khẩu bằng OTP email; đổi mật khẩu trực tiếp trong phiên hợp lệ và đăng xuất toàn cục sau khi đổi.
- Header đọc Viewer từ server, không dùng tên lưu trong localStorage làm trạng thái đăng nhập.
- Form có lỗi từng trường, giữ nội dung sau lỗi, hiện/ẩn mật khẩu và khóa gửi khi đang chờ.

## Cấu hình

`.env` cần cùng project Supabase cho URL, publishable key và database. `APP_URL=http://localhost:3000` đã được bổ sung cho môi trường phát triển. Khi triển khai, dùng origin HTTPS của website và cập nhật Site URL cùng Redirect URLs trong Supabase Auth.

Supabase Auth của project hiện cho phép email/password, cho đăng ký và yêu cầu xác nhận email (đã kiểm tra qua endpoint settings công khai). Không tắt xác nhận để bỏ qua bước kiểm thử email.

- Site URL khi phát triển: `http://localhost:3000`.
- Redirect URLs cho phép callback `/auth/confirm`, bao gồm URL khôi phục có `?next=reset-password` khi dùng PKCE mặc định.
- Mẫu Confirm signup tùy chỉnh: `docs/supabase-confirm-email.html`.
- **Bắt buộc khi triển khai OTP:** vào Supabase Dashboard → Authentication → Email Templates (hoặc Emails → Templates) → Reset password, thay nội dung bằng toàn bộ file `docs/supabase-reset-email.html` rồi lưu. Mẫu dùng `{{ .Token }}` để gửi mã OTP. Thay file trong Git không tự cập nhật mẫu email trên Supabase.
- Luồng mới: `resetPasswordForEmail` gửi thư khôi phục → `verifyOtp({ email, token, type: "recovery" })` tạo phiên đã xác thực → trang `/reset-password` gọi `updateUser`. Không dùng OTP đăng nhập để tạo tài khoản mới.
- Giao diện hỗ trợ mã gồm 6–10 chữ số theo cấu hình Supabase, chờ 60 giây trước khi gửi lại. Giới hạn gửi/xác thực và thời hạn mã do Supabase thực thi; bộ đếm trên giao diện chỉ hỗ trợ trải nghiệm.
- Cần cấu hình dịch vụ gửi email/SMTP phù hợp trên Supabase để gửi tới người dùng thật.

OTP mới được nhập ngay trên website, không cần mở liên kết hoặc cookie PKCE từ trình duyệt gửi yêu cầu. Callback cũ vẫn hỗ trợ liên kết đã gửi trước khi đổi mẫu. Đảm bảo SMTP, người gửi và giới hạn gửi thư của Supabase phù hợp; thông báo trên form không bảo đảm email đã đến hộp thư.

## Kiểm tra bằng tài khoản của bạn

1. Đăng ký, xác nhận email và kiểm tra `/account` hiển thị đúng tên/email.
2. Reload trang, đóng rồi mở lại tab; header vẫn nhận tài khoản khi phiên hợp lệ.
3. Đăng xuất; mở `/account` phải chuyển về `/login`.
4. Thử sai mật khẩu, email chưa xác nhận và hai mật khẩu đăng ký không khớp.
5. Gửi mã tới email tài khoản đã đăng ký, nhập mã trên website, đặt mật khẩu mới và đăng nhập lại. Kiểm tra mật khẩu cũ không còn dùng được.
6. Thử OTP sai/hết hạn/đã dùng, gửi lại mã, đổi email, giới hạn gửi và lỗi mạng. Không được mở bước đặt mật khẩu khi OTP không hợp lệ.

Kiểm thử tự động dùng dịch vụ Auth mô phỏng để kiểm tra cả luồng thành công mà không tự tạo tài khoản hoặc gửi thư. Việc xác nhận email thật và đổi mật khẩu thật cần được kiểm tra bằng hộp thư do bạn kiểm soát.

## Phạm vi dữ liệu và bảo vệ

Phần học vẫn dùng provider localStorage của bản demo; đăng nhập chưa chuyển lịch sử học thử lên Supabase. Account hiển thị rõ điều này. Không có chức năng giả như đăng nhập Google hoặc đồng bộ tiến độ chưa triển khai.

Supabase áp dụng giới hạn Auth. Form hiển thị lỗi chờ khi nhận HTTP 429; không dùng một bộ đếm trong bộ nhớ server thay cho giới hạn dịch vụ. Khi bật CAPTCHA hoặc chính sách yêu cầu xác thực lại/nonce cho đổi mật khẩu, cần tích hợp giao diện tương ứng; không tắt chính sách để làm form chạy. MFA chưa nằm trong luồng email/password này. Global sign-out thu hồi refresh token; access token đã cấp có thể tồn tại đến khi hết hạn.

Tài liệu đối chiếu: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [khôi phục mật khẩu](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail).
