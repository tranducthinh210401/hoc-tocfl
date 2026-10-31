# Máy chủ trung gian cho Trợ lý TILO (Cloudflare Workers AI — miễn phí)

Không cần khóa AI. Dùng hạn mức miễn phí mỗi ngày của tài khoản Cloudflare; hết hạn mức thì trợ lý báo "hết lượt" và tự dùng lại khi Cloudflare đặt lại hạn mức.

## Cài đặt tự động (khuyên dùng, làm 1 lần ~5 phút, chạy được trên điện thoại)
1. Tạo tài khoản miễn phí tại https://dash.cloudflare.com
2. Mục *My Profile → API Tokens → Create Token*, chọn mẫu **Edit Cloudflare Workers** → tạo và chép token. Chép thêm **Account ID** (trang Workers & Pages, cột bên phải).
3. Vào repo GitHub → *Settings → Secrets and variables → Actions → New repository secret*, thêm 2 secret:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
4. Vào tab *Actions → Deploy TILO worker → Run workflow*. Khi chạy xong, log in ra địa chỉ dạng `https://tro-ly-tocfl.<tên-bạn>.workers.dev`.
5. Mở `tro-ly.js`, dán địa chỉ đó vào dòng `var API='...'` ở đầu file rồi commit.

## Ghi chú
- Mô hình đổi trong `wrangler.toml` (biến `MODEL`).
- Nếu địa chỉ web của bạn khác `https://tranducthinh210401.github.io`, sửa `ALLOWED_ORIGINS`.
- Có thể bật giới hạn theo IP (xem `wrangler.toml`).
