# Máy chủ trung gian cho Trợ lý từ điển

Giấu khóa Claude API (không để lộ trên GitHub), chỉ trang web của bạn mới gọi được.

## Cài đặt (làm 1 lần, ~10 phút, miễn phí gói Cloudflare Workers)
1. Tạo khóa API tại https://console.anthropic.com → *API keys* (cần nạp một ít credit, vài đô dùng rất lâu).
2. Tạo tài khoản https://dash.cloudflare.com (miễn phí).
3. Trên máy có Node.js, trong thư mục `worker`:
   ```
   npm i -g wrangler
   wrangler login
   wrangler secret put ANTHROPIC_API_KEY     # dán khóa ở bước 1
   wrangler deploy
   ```
4. Wrangler in ra địa chỉ dạng `https://tro-ly-tocfl.<tên-bạn>.workers.dev`. Mở `tro-ly.js`, dán địa chỉ đó vào dòng `var API='...'` ở đầu file rồi commit.
5. Nếu địa chỉ web của bạn khác `https://tranducthinh210401.github.io`, sửa `ALLOWED_ORIGINS` trong `wrangler.toml` rồi `wrangler deploy` lại.

Chi phí: mỗi lượt dịch ~ vài trăm token, giải thích ngữ pháp ~ 1–2 nghìn token. Có giới hạn 150 lượt/ngày/IP nếu bạn bật KV (xem `wrangler.toml`).
