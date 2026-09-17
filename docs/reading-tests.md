# Nhập đề đọc

1. Vào **Quản trị → Đề kiểm tra → Tạo đề** (hoặc sửa đề có sẵn).
2. Nhập thông tin đề. Thêm câu hỏi, chọn **Tạo nhóm bài đọc mới**.
3. Chọn mẫu **Bài viết / thông báo**, **Email / thư** hoặc **Trang web**. Dán văn bản, giữ xuống dòng. Một nhóm hỗ trợ tối đa 3 văn bản.
4. Nhập các câu liên quan. Câu mới tự dùng nhóm của câu đang chọn; có thể đổi nhóm bằng danh sách **Nhóm bài đọc cho câu này**. Sửa bài đọc sẽ cập nhật mọi câu trong nhóm.
5. Dùng **Nhập nhanh: dán nhiều câu hỏi A–D** để thêm nhiều câu một lần. Chỉ thêm khi toàn bộ khối hợp lệ; câu mới nối vào cuối đề. Nếu câu đang chọn chưa có nội dung câu hỏi, lựa chọn hay giải thích, hệ thống thay câu trống đó bằng các câu nhập vào và giữ nhóm bài đọc đã tạo.
6. Bấm **Xem thử giao diện làm bài**, kiểm tra rồi **Lưu nội dung**. Bỏ chọn Công khai nếu chưa muốn học viên thấy đề.

Ví dụ nội dung dán:

```text
147. What is the purpose of the email?
A. To place an order
B. To announce a meeting
C. To request a refund
D. To introduce a colleague
Answer: B
Explanation: The email announces a meeting.

148. When will the meeting start?
A. At 8 a.m.
B. At 9 a.m.
C. At 10 a.m.
D. At 11 a.m.
Answer: C
```

Cũng chấp nhận `Đáp án:` và `Giải thích:`. Mỗi lựa chọn một dòng, đáp án bắt buộc, giải thích không bắt buộc. Số câu được giữ nguyên (ví dụ 147–200); không được trùng nhau. Tối đa 100 câu mỗi đề.

Trong lúc thi, nhấn số câu để chuyển trực tiếp. Ô xanh là câu đã lưu lựa chọn, ô trắng là câu chưa trả lời, viền đậm là câu đang xem. Màu xanh không có nghĩa đáp án đúng. Đồng hồ và thời điểm nộp vẫn do máy chủ kiểm soát. Kết quả giữ bài đọc tại thời điểm bắt đầu phiên.

Đây là nhập văn bản có cấu trúc, chưa tự nhận dạng ảnh hoặc nhập trực tiếp tệp PDF/Word. Có thể sao chép nội dung văn bản từ tài liệu vào mẫu trên.

## Triển khai

Chạy `npm run db:migrate` trên database đích trước khi triển khai code mới, rồi `npm run db:generate`. Migration `20260917120000_reading_questions` chỉ thêm hai cột nullable, tương thích dữ liệu đề cũ. Phiên đã bắt đầu trước khi bổ sung bài đọc giữ nguyên bản đề cũ; dùng phiên mới để thấy nội dung mới.
