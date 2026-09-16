# Đồng bộ dữ liệu và vận hành

## Dữ liệu tài khoản

Người đã đăng nhập đọc/ghi bộ từ cá nhân, từ đã nhớ, bộ từ đã lưu, mục tiêu ngày và lượt ôn qua database. Provider được tạo lại theo UUID tài khoản, không tái sử dụng trạng thái của tài khoản trước. Khách vẫn dùng `trex-learning-v1`.

Server luôn xác thực tài khoản; UUID mà client gửi chỉ được dùng để phát hiện đổi tài khoản, không để chọn người sở hữu. Bộ từ mới luôn PRIVATE. Payload không được phép cập nhật role, owner hoặc điểm Attempt. Các ID từ/bộ từ phải thuộc nội dung có quyền truy cập. Phiên bản gồm thời điểm cập nhật profile và các bộ từ sở hữu; thay đổi trên tab khác hoặc admin sửa bộ từ làm phiên bản cũ bị từ chối. Lưu trong transaction, khóa theo người dùng và khóa hàng bộ từ đang sửa. Không khóa toàn bộ tài khoản trên hệ thống; cập nhật admin vào cùng hàng được tuần tự hóa bởi database.

Nút nhập dữ liệu học thử hiện khi có dữ liệu trên thiết bị. Chỉ nhập bộ từ, trạng thái đã nhớ, lượt ôn và bộ từ đã lưu; mục tiêu tài khoản hiện tại và kết quả chính thức được giữ. Bản gốc không bị xóa. ID nhập gắn với tài khoản để không chiếm ID của người khác; nhập lại không nhân đôi bộ từ. Không tự nhập lịch sử điểm do trình duyệt có thể chỉnh sửa.

Khi mất mạng, thay đổi được giữ trong bộ nhớ và bản dự phòng riêng theo UUID tài khoản nếu localStorage cho phép. Có nút thử đồng bộ lại. Khi xung đột, tải bản mới, tải xuống bản sửa để đối chiếu; nút khôi phục yêu cầu xác nhận vì sẽ thay thế danh sách bộ từ/mục tiêu/trạng thái đã nhớ bằng bản sửa. Đóng trang khi đang lưu sẽ có cảnh báo. Không có cơ chế tự đồng bộ khi trình duyệt đã đóng.

Dashboard đọc tiến độ tài khoản và tối đa 200 bài gần nhất; tổng số bài tính toàn bộ, điểm trung bình tính trên 200 bài gần nhất. Lịch sử `/history` phân trang xem toàn bộ. Ngày học dùng múi giờ Việt Nam.

Các file chính: `src/actions/learning.ts`, `src/lib/learning-schema.ts`, `src/lib/learning-store.ts`, `src/components/learning-provider.tsx`. Dùng các bảng hiện có, không có migration mới.

## Kiểm tra vận hành

`npm run ops:check` chỉ kiểm tra kết nối, số lượng nội dung, tài khoản admin được yêu cầu và Google provider. Không in URL kết nối/khóa. `node scripts/check-readiness.cjs --bootstrap-admin` chỉ cấp admin đầu tiên cho đúng email đã chỉ định nếu đã xác nhận, có profile và chưa có admin nào. Không dùng nó để đổi quyền thường xuyên.

Người dùng xác nhận đã cấu hình Google. Lần kết nối trực tiếp trong đợt này chưa thực hiện được do duyệt quyền mạng hết thời gian. Cần đăng nhập Google thực tế trên domain triển khai để xác nhận callback/cookie.

## Phiên hết hạn

`npm run ops:finalize` xử lý tối đa 100 phiên đến hạn mỗi lần chạy, dùng cùng bộ xử lý thời gian và advisory lock với web. Mỗi phiên có transaction riêng, kết quả upsert theo ID nên chạy lại không nhân đôi. Trên hosting, cấu hình scheduler chạy lệnh này mỗi phút. Đây là CLI đã bổ sung, **chưa có lịch chạy tự động trên hosting** vì chưa có môi trường hosting được cấu hình trong nhiệm vụ này. Nếu chưa bật lịch, mở lại phiên vẫn hoàn tất kết quả theo mốc cũ.

Quiz bây giờ đồng bộ mỗi 5 giây hoặc khi đến hạn; chọn đáp án gửi ngay. Đồng hồ giao diện vẫn cập nhật 100ms. Không dùng số test đơn vị để suy ra sức tải máy chủ. Trước mở rộng, đo độ trễ p95 với nhiều phiên đăng nhập riêng trên staging; mỗi tài khoản/mỗi phiên cần riêng, đo lỗi giao dịch, số connection và độ trễ nhận đáp án 5 giây.

## Sao lưu và diễn tập phục hồi

```
npm run ops:backup -- export .backups/trex-app.json
npm run ops:backup -- restore-check .backups/trex-app.json
```

Export lấy snapshot nhất quán các bảng ứng dụng. File chứa dữ liệu cá nhân, nằm trong thư mục bị Git bỏ qua; giữ quyền truy cập hạn chế. Script từ chối ghi đè file backup đã có.

Đặt `RESTORE_DATABASE_URL` vào môi trường riêng trỏ tới database **khác, trống**, đã áp dụng schema/migrations. Không dùng production. `restore-check` chèn toàn bộ theo thứ tự quan hệ, kiểm tra constraints/số lượng rồi ROLLBACK; `restore` dùng cùng quy trình nhưng COMMIT vào staging. Script từ chối đích cùng host/database với nguồn và từ chối database có dữ liệu ứng dụng. Kiểm tra kết nối kỹ nếu dùng pooler/alias khác cùng một database.

Backup này **không gồm Supabase Auth, Storage hoặc cấu hình OAuth**. Cần backup tương ứng từ nhà cung cấp để khôi phục toàn hệ thống. Chưa chạy diễn tập với database thật trong đợt này do kết nối bị chặn; không xem script đã tồn tại là bằng chứng phục hồi thành công.

## Ghi nhận lỗi và CI

`src/instrumentation.ts` ghi JSON lỗi request vào log server: thời gian, digest, mẫu route và loại request. Không ghi cookie, nội dung form, URL đầy đủ hoặc message có thể chứa bí mật. Hosting cần lưu và theo dõi log; chưa cấu hình dịch vụ cảnh báo ngoài.

`.github/workflows/ci.yml` chạy lint, tests, Prisma generate và build khi push/PR. Đã tạo file nhưng chưa push/kích hoạt GitHub Actions. CI dùng biến giả và kiểm thử mock, không kiểm tra database production.

## Nghiệm thu còn cần môi trường thật

1. Hai tài khoản, hai trình duyệt: tạo từ/đánh dấu/đổi mục tiêu; đăng xuất và đổi tài khoản; xác nhận dữ liệu tách biệt.
2. Hai tab: sửa cùng lúc, xác nhận báo xung đột; ngắt mạng khi lưu, thử lại và kiểm tra kết quả.
3. Nhập học thử hai lần; xác nhận không trùng bộ từ và không nhập điểm chính thức.
4. Hoàn tất đăng ký/email/Google, admin CRUD bằng tài khoản thật; kiểm tra desktop và điện thoại.
5. Tạo phiên rồi đóng trình duyệt; chạy finalizer; kiểm tra kết quả/lịch sử và không nhân đôi khi chạy lại.
6. Thử tải trên staging; xuất backup, chạy restore-check và đăng nhập kiểm tra staging sau phục hồi có chủ đích.


## Cấu hình Vercel đã chuẩn bị

`vercel.json` chạy Prisma generate trước build và gọi `/api/cron/finalize-sessions` mỗi ngày lúc 00:00 UTC (07:00 Việt Nam; lịch Hobby có thể trễ trong giờ). Mặc định dùng lịch tương thích Hobby. Nếu dùng Pro và muốn xử lý mỗi phút, đổi `schedule` thành `* * * * *`. Đây là tổng kết các phiên bỏ dở; bài đang mở vẫn kết thúc đúng hạn ngay trên server, không chờ cron.

Endpoint yêu cầu `Authorization: Bearer CRON_SECRET`, khóa ít nhất 32 ký tự; thiếu cấu hình trả 503, sai khóa trả 401. Vercel tự gửi header khi đã đặt CRON_SECRET trong môi trường Production. Mỗi lượt xử lý tối đa 100 phiên và dừng sau khoảng 40 giây trước giới hạn function 60 giây. Log `batchFull`/số phiên cần được theo dõi nếu lưu lượng vượt khả năng xử lý hàng ngày; tăng tần suất trên gói hỗ trợ. Các lần chạy chồng nhau dùng try-lock, không nhân đôi Attempt.

Trong Vercel Project → Settings → Environment Variables đặt: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, DATABASE_URL, DIRECT_URL, APP_URL là domain production, CRON_SECRET. Không đặt RESTORE_DATABASE_URL trên ứng dụng production; biến đó chỉ dùng khi diễn tập cục bộ. Supabase cần Site URL và allowed redirect `/auth/confirm` tương ứng domain production. Production dùng connection pooler phù hợp Supabase; không công khai mật khẩu kết nối.

Chưa thực hiện deploy, thêm biến môi trường hay kích hoạt cron trên tài khoản Vercel. Sau deploy, kiểm tra Cron Jobs và log một lần chạy. Không đưa secret vào URL hoặc mã nguồn. CI cũng chưa được push.

Nguồn chính thức: https://vercel.com/docs/cron-jobs/usage-and-pricing và https://vercel.com/docs/cron-jobs/manage-cron-jobs .

## Kết quả kiểm tra trong đợt cập nhật

69 kiểm thử đơn vị/action/script đã đạt (Auth 18, admin/session 20, phát âm 12, đồng bộ 10, vận hành 9), cùng các assertion thời gian quiz/test. ESLint và production build đã đạt. Các kiểm thử database/cron/backup ở đây dùng mock; chưa thay thế kiểm tra kết nối và phục hồi thật. Không thay đổi schema, không chạy seed và không tự nhập dữ liệu học thử của người dùng.
