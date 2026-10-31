/* Máy chủ trung gian cho Trợ lý từ điển — © 2026 Học TOCFL cùng Thịnh & Loan
   Giấu khóa API, chỉ cho phép trang web của bạn gọi, giới hạn độ dài và số lần gọi. */

const SYS_TRANSLATE = `Bạn là từ điển Hán–Việt chuyên cho người học TOCFL (tiếng Quan thoại Đài Loan).
Quy tắc:
- Chữ Hán luôn dùng PHỒN THỂ, từ vựng/cách nói theo Đài Loan (ví dụ 計程車, 捷運, 軟體, 影片).
- Nếu đầu vào là chữ Hán (phồn hoặc giản thể): dịch sang tiếng Việt tự nhiên, chính xác; đồng thời trả "traditional" là bản phồn thể của đầu vào.
- Nếu đầu vào là tiếng Việt: dịch sang tiếng Trung phồn thể tự nhiên, đúng cách nói người Đài Loan.
- Pinyin có dấu thanh, tách theo từ, không viết hoa tuỳ tiện.
- Với từ/cụm ngắn: liệt kê các nghĩa/cách dùng chính trong "alternatives" (tối đa 5), nêu sắc thái nếu khác biệt.
- Không bịa. Nếu không chắc, nói rõ trong "note".
Chỉ trả về MỘT đối tượng JSON, không kèm chữ nào khác:
{"direction":"zh2vi"|"vi2zh","translation":"...","pinyin":"...","traditional":"... (chỉ khi đầu vào là chữ Hán)","alternatives":["..."],"note":"... (tuỳ chọn, ngắn)"}`;

const SYS_GRAMMAR = `Bạn là giáo viên tiếng Hoa (Quan thoại Đài Loan) dạy người Việt ôn thi TOCFL. Hãy giải thích ngữ pháp của câu/cụm từ người dùng đưa, bằng tiếng Việt dễ hiểu.
Quy tắc:
- Chữ Hán dùng PHỒN THỂ. Pinyin có dấu thanh.
- Chỉ nêu các điểm ngữ pháp/từ hư THỰC SỰ có trong câu (tối đa 4), mỗi điểm gồm: cấu trúc, ý nghĩa, cách dùng, lỗi hay gặp của người Việt, và 1–2 ví dụ ngắn (có pinyin + nghĩa Việt). Ước lượng cấp TOCFL nếu có thể (Chuẩn bị 1/2, Nhập môn, Cơ bản, Tiến cao...).
- "breakdown" tách câu thành các thành phần (từ, pinyin, nghĩa, vai trò ngữ pháp).
- Không bịa quy tắc; nếu câu quá ngắn/không có điểm đặc biệt thì nói rõ.
Chỉ trả về MỘT đối tượng JSON, không kèm chữ nào khác:
{"translation":"nghĩa cả câu bằng tiếng Việt","pinyin":"...","breakdown":[{"han":"","pinyin":"","vi":"","role":""}],"points":[{"pattern":"","level":"","explain":"","mistake":"","examples":[{"han":"","pinyin":"","vi":""}]}],"summary":"1–2 câu tóm tắt"}`;

function cors(env, req) {
  const allow = (env.ALLOWED_ORIGINS || "https://tranducthinh210401.github.io").split(",").map(s => s.trim());
  const o = req.headers.get("Origin") || "";
  const ok = allow.includes(o) || allow.includes("*");
  return {
    ok,
    h: {
      "Access-Control-Allow-Origin": ok ? o : allow[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    },
  };
}
const json = (obj, status, h) => new Response(JSON.stringify(obj), { status, headers: { ...h, "Content-Type": "application/json; charset=utf-8" } });

/* Giới hạn mỗi IP theo ngày (cần gắn KV tên LIMITS; không gắn thì bỏ qua) */
async function overLimit(env, req) {
  if (!env.LIMITS) return false;
  const ip = req.headers.get("CF-Connecting-IP") || "x";
  const key = "d:" + new Date().toISOString().slice(0, 10) + ":" + ip;
  const n = parseInt((await env.LIMITS.get(key)) || "0", 10);
  if (n >= parseInt(env.DAILY_LIMIT || "150", 10)) return true;
  await env.LIMITS.put(key, String(n + 1), { expirationTtl: 172800 });
  return false;
}

function parseModel(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("no json");
  return JSON.parse(m[0]);
}

export default {
  async fetch(req, env) {
    const { ok, h } = cors(env, req);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
    if (req.method !== "POST") return json({ ok: false, error: "method" }, 405, h);
    if (!ok) return json({ ok: false, error: "origin" }, 403, h);
    if (!env.ANTHROPIC_API_KEY) return json({ ok: false, error: "no_key" }, 500, h);

    let body;
    try { body = await req.json(); } catch { return json({ ok: false, error: "bad_json" }, 400, h); }
    const q = String(body.q || "").trim().slice(0, 400);
    const task = body.task === "grammar" ? "grammar" : "translate";
    if (!q) return json({ ok: false, error: "empty" }, 400, h);
    if (await overLimit(env, req)) return json({ ok: false, error: "limit" }, 429, h);

    const system = task === "grammar" ? SYS_GRAMMAR : SYS_TRANSLATE;
    const hint = task === "translate" && (body.dir === "zh2vi" || body.dir === "vi2zh")
      ? `\n(Hướng dịch yêu cầu: ${body.dir === "zh2vi" ? "Hán → Việt" : "Việt → Hán phồn thể"})` : "";
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
          model: env.MODEL || "claude-haiku-5-5",
          max_tokens: task === "grammar" ? 1800 : 600,
          temperature: 0.2,
          system,
          messages: [{ role: "user", content: "<input>\n" + q + "\n</input>" + hint }],
        }),
      });
      if (!r.ok) return json({ ok: false, error: "upstream_" + r.status }, 502, h);
      const d = await r.json();
      const text = (d.content || []).map(c => c.text || "").join("");
      return json({ ok: true, task, data: parseModel(text) }, 200, h);
    } catch (e) {
      return json({ ok: false, error: "fail" }, 502, h);
    }
  },
};
