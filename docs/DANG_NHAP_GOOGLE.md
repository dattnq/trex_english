# Đăng nhập Google (Gmail)

## Phần đã có trong dự án

Nút **Tiếp tục với Google** nằm ở cả `/login` và `/register`. Người dùng chọn tài khoản trên Google; web không yêu cầu nhập mật khẩu Gmail. Luồng dùng Supabase Auth với PKCE, lưu phiên bằng cookie rồi quay về `/account`.

`src/actions/auth.ts` chứa `googleLoginAction`; `src/lib/auth-config.ts` kiểm tra provider trước khi chuyển trang. `src/app/auth/confirm/route.ts` đổi mã xác thực lấy phiên và tạo hồ sơ qua `ensureProfile`. Hồ sơ mới có quyền LEARNER; đăng nhập lại không ghi đè tên hoặc vai trò đã có. Không tự cấp ADMIN dựa vào email/tên/metadata Google.

Ngày 15/09/2026, kiểm tra cấu hình công khai của Supabase cho kết quả **Google chưa được bật**. Nút hiện thông báo rõ ràng và vẫn cho dùng đăng nhập email. Cần cấu hình dịch vụ bên dưới để đăng nhập Google thật.

## Cấu hình dịch vụ

1. Trong [Google Auth Platform](https://console.cloud.google.com/auth/clients), tạo OAuth Client loại **Web application**; hoàn tất thông tin ứng dụng và đối tượng sử dụng.
2. Điền **Authorized JavaScript origins**:
   ```text
   http://localhost:3000
   ```
3. Điền **Authorized redirect URIs** bằng callback Supabase của dự án:
   ```text
   https://tbganeppoxybeoedylsw.supabase.co/auth/v1/callback
   ```
4. Trong Supabase → Authentication → Sign In / Providers → Google: bật Google, nhập **Client ID** và **Client Secret** từ bước trên, lưu cấu hình.
5. Trong Supabase → Authentication → URL Configuration: Site URL là `http://localhost:3000`; thêm Redirect URL:
   ```text
   http://localhost:3000/auth/confirm
   ```

Nguồn cấu hình: [hướng dẫn Google của Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google).

Google Client Secret chỉ cần lưu ở Supabase; không đặt trong biến `NEXT_PUBLIC_*`, mã frontend hoặc Git. Dự án đang dùng Supabase hosted, nên Google callback là URL `supabase.co` ở trên dù web chạy localhost. Không nhầm callback này với `/auth/confirm` của website.

Khi đưa web lên domain thật, đổi `APP_URL`, bổ sung origin/domain và redirect URL tương ứng. Nếu đổi sang một Supabase project khác, lấy lại callback từ Google provider của project đó.

## Kiểm tra sau khi bật

- Mở `/login`, bấm **Tiếp tục với Google**, chọn tài khoản và hoàn tất xác thực.
- Xác nhận được chuyển về `/account` và hiện đúng email/tên.
- Tải lại trang: phiên vẫn được giữ; đăng xuất rồi đăng nhập Google lại: không tạo hồ sơ mới hay đổi quyền.
- Hủy ở Google: quay về trang lỗi có liên kết thử đăng nhập lại.
- Nếu báo `redirect_uri_mismatch`: đối chiếu callback Supabase trong Google Console. Nếu quay về sai website: kiểm tra `APP_URL` và URL Configuration của Supabase.
- Mở và hoàn thành xác thực trong cùng trình duyệt để giữ cookie PKCE.

Không cần migration hoặc seed mới. Luồng đăng ký/đăng nhập email hiện có được giữ nguyên.

## Kiểm thử đã chạy

`npm run test:auth` kiểm tra thêm Google action, provider chưa bật, lỗi kết nối, callback bị hủy/hết hạn và hồ sơ Google không được tự nâng quyền. Kết hợp với `npm run test:admin` có 35 test đã qua. Đã bấm nút trên localhost và xác minh thông báo provider chưa bật. Luồng Google thật chưa thể kiểm tra trước khi cấu hình Client ID/Client Secret trong Supabase.
