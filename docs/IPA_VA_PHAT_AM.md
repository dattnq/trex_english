# IPA và phát âm

Nhập từ tiếng Anh, rời ô nhập để tự lấy IPA nếu phiên âm đang trống; có thể dùng nút Tra IPA và sửa thủ công. Thêm từ cá nhân và lưu nội dung admin cũng bổ sung IPA còn thiếu. Phiên âm nhập tay được giữ lại.

IPA lấy từ bộ dữ liệu cục bộ `data/dictionaries/en_US.txt` để dùng khi dịch vụ ngoài chậm. Nguồn, giấy phép MIT và thông tin bản dữ liệu nằm cùng thư mục. Từ chưa có trong dữ liệu cần nhập IPA thủ công; không tự suy đoán phiên âm.

Nút nghe ưu tiên bản thu DictionaryAPI, khi không có hoặc mạng lỗi sẽ dùng giọng tiếng Anh của thiết bị. Thiết bị phải hỗ trợ Web Speech và có giọng thích hợp; chất lượng/giọng phụ thuộc trình duyệt. Phát âm không tự phát khi vào trang. Dịch vụ bản thu đã gặp timeout trong kiểm tra thực tế; nhánh bản thu thành công được kiểm thử bằng dữ liệu giả lập.

Các file: `src/lib/pronunciation.ts`, `local-pronunciation.ts`, `pronunciation-client.ts`, `src/app/api/pronunciation/route.ts`, các component `pronunciation-*`. Không cần migration. Chạy `npm run test:pronunciation` để kiểm tra tra IPA, lọc URL âm thanh và phương án dự phòng.
