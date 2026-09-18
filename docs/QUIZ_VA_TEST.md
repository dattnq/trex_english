# Quiz và Test

## Luồng sử dụng

- `/quiz`: chọn bộ từ, nhấn **Bắt đầu / tiếp tục**. Mỗi câu có 10 giây; lựa chọn được khóa khi máy chủ nhận. Phản hồi đúng/sai hiện 1,5 giây, sau đó tự chuyển câu. Không chọn kịp được tính sai. Cuối bài hiện tổng điểm và liên kết xem giải thích.
- `/tests`: chọn đề công khai. Đồng hồ đếm theo số phút do admin đặt. Có thể chuyển câu và đổi lựa chọn; không có nút kiểm tra đáp án trong lúc làm. Nộp bài cần xác nhận số câu đã chọn. Hết giờ tự kết thúc khi phiên kết nối với máy chủ.
- `/history`: các phiên chưa đóng và kết quả trên tài khoản; có phân trang. Mở kết quả để xem từng đáp án, giải thích và lọc câu chưa đúng.
- Tải lại trang hoặc rời tab không đặt lại thời gian. Nếu đóng trình duyệt hoàn toàn, không có tác vụ nền tự ghi kết quả: mở phiên lại sẽ tính hết giờ theo mốc cũ và lưu kết quả.
- Bộ từ tự tạo chỉ có trong trình duyệt dùng cùng luật quiz nhưng lưu phiên/kết quả cục bộ. Đây là học thử, không chống sửa đồng hồ hoặc sửa localStorage, không tự đồng bộ vào tài khoản.

## Các file chính

- `src/lib/session-engine.ts`: chuyển trạng thái trả lời → phản hồi → hoàn thành; thời hạn tuyệt đối, phiên bản chống ghi đè và chấm điểm. `publicState` loại đáp án/giải thích khỏi dữ liệu bài đang làm; quiz chỉ trả phản hồi của câu hiện tại sau khi khóa lựa chọn.
- `src/actions/attempts.ts`: kiểm tra tài khoản, quyền sở hữu phiên, đề công khai; tiếp tục phiên cũ; khóa transaction chống lệnh đồng thời; lưu snapshot và kết quả một lần theo ID. Poll không thay đổi trạng thái không ghi DB.
- `src/components/session-player.tsx`: đồng hồ, lựa chọn, chuyển câu test, phản hồi quiz và tổng điểm. Poll không khóa nút trả lời. Test đồng bộ mỗi 5 giây và lúc hết hạn; quiz đồng bộ mỗi 5 giây hoặc khi đến hạn. Lựa chọn gửi ngay, lỗi mạng được báo rõ.
- `src/components/question-session.tsx`: lưu và khôi phục quiz cá nhân bằng localStorage, dùng chung bộ xử lý thời gian.
- `src/app/history/page.tsx`: chỉ lấy phiên và kết quả thuộc người dùng hiện tại.
- `src/components/attempt-result.tsx`: hiển thị kết quả và bộ lọc câu sai cho cả kết quả tài khoản và cục bộ.

Thời gian máy chủ quyết định việc nhận đáp án. Khi mạng chậm, bấm sát lúc hết giờ có thể không được chấp nhận; giao diện báo lựa chọn chưa được nhận. Khi mất mạng, thời gian vẫn tính.

## Database và kiểm tra

Đợt này không đổi schema; cần có migration `20260915000000_learning_sessions` (đã áp dụng trên database đang dùng). Môi trường mới chạy `npm run db:migrate` và `npm run db:generate` sau khi cấu hình `.env`.

Chạy `npm run test:logic`, `npm run test:admin`, `npm run test:auth`, `npm run test:pronunciation`, `npm run lint` và `npx next build --webpack`.

Kiểm tra thủ công: chọn đúng/sai quiz; chờ quá 10 giây; rời tab rồi quay lại; tải lại test đã chọn đáp án; đổi câu và sửa lựa chọn; nộp sớm; chờ hết giờ; mở lịch sử; đăng nhập tài khoản khác để kiểm tra cách ly kết quả. Build/kiểm thử tự động đã đạt; kiểm tra trình duyệt trực tiếp đợt này bị chặn bởi thời gian chờ của hệ thống duyệt quyền.

Cập nhật: có CLI `npm run ops:finalize` để đóng phiên quá hạn; cần cấu hình scheduler trên hosting. Quiz bộ từ cá nhân của tài khoản dùng server; chỉ khách dùng phiên cục bộ. Xem `DONG_BO_VA_VAN_HANH.md`.
