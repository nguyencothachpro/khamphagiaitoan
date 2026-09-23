# Khám Phá Giải Toán

Đây là **lớp giao diện (vỏ)** cho một không gian thảo luận Toán, tách khỏi dự án cũ.

## Mục tiêu hiện tại

- Giao diện chat riêng, đẹp và tối giản.
- Dán ảnh chụp màn hình trực tiếp.
- Kéo thả hoặc đính kèm ảnh/PDF/Word/tệp văn bản.
- Có lịch sử hiển thị ở thanh bên.
- Có nút mở ChatGPT trong tab riêng.
- Không lưu mật khẩu ChatGPT và không cố lấy cookie/phiên đăng nhập ChatGPT.
- **Không dùng OpenAI API trong phiên bản này.**

### Lưu ý kiến trúc

ChatGPT cá nhân và OpenAI API là hai hệ thống khác nhau. Website này vì vậy không giả vờ rằng nó đang dùng tài khoản ChatGPT của người dùng ở phía máy chủ. Nút “Mở ChatGPT” mở dịch vụ ChatGPT chính thức để người dùng đăng nhập và sử dụng tài khoản của mình.

Nếu sau này muốn “ruột AI” chạy ngay trong giao diện này, cần chọn một cơ chế kết nối AI được hỗ trợ chính thức hoặc một AI/server riêng; không nên thu thập email, mật khẩu hoặc cookie ChatGPT.

## Chạy

Có thể deploy như website tĩnh trên Vercel/GitHub Pages hoặc mở trực tiếp `index.html`.