# Khám Phá Giải Toán — Hành Trình Khám Phá

Đây là dự án độc lập. Sản phẩm không phải chatbot thông thường: AI nhận bài toán/ảnh/tệp rồi trả về **cấu trúc Hành Trình Khám Phá Toán**.

Mạch chính:
**Bí ẩn → Manh mối → Khám phá → Chuẩn hóa → Lời giải → 5 bài luyện tập → Vận dụng**

Hệ thống dùng **Structured Output / JSON Schema** để AI trả về dữ liệu có cấu trúc, sau đó giao diện tự render thành các khối. OpenAI và Gemini đều có cơ chế structured output/JSON schema; xem tài liệu chính thức của từng nền tảng. 

## Cấu hình Vercel

Chọn provider ngay trên giao diện:
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (mặc định `gpt-5.6-luna`)
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (mặc định `gemini-3.8-flash`)

API key chỉ nằm ở biến môi trường server, không đưa vào JavaScript trình duyệt.

## Không phải LMS

Phiên bản này tập trung vào **bộ máy biến bài toán thành Hành Trình Khám Phá**. Không tự thêm giao bài, chấm điểm, quản lý học sinh hay module quản trị.