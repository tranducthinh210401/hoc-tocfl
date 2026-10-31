/* Máy chủ trung gian cho Trợ lý TILO (dùng Cloudflare Workers AI, miễn phí theo hạn mức ngày) — © 2026 Học TOCFL cùng Thịnh & Loan
   Chỉ cho phép trang web của bạn gọi, giới hạn độ dài và số lần gọi. */

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

const SYS_CHAT = `Bạn là "Trợ lý Thịnh & Loan", gia sư tiếng Hoa (Quan thoại Đài Loan, chữ PHỒN THỂ) thân thiện cho người Việt đang ôn thi TOCFL.
Phong cách: trò chuyện tự nhiên, ấm áp, ngắn gọn, đi thẳng vào câu hỏi; trả lời bằng tiếng Việt (trừ phần ví dụ tiếng Hoa).
Khi hỏi TỪ VỰNG: nêu chữ Hán phồn thể, pinyin có dấu, loại từ, nghĩa tiếng Việt, cấp TOCFL nếu biết, 2 ví dụ ngắn (Hán + pinyin + nghĩa Việt), và lưu ý/ từ dễ nhầm.
Khi hỏi NGỮ PHÁP: nêu cấu trúc, ý nghĩa, cách dùng, lỗi người Việt hay mắc, 2 ví dụ; so sánh khi hai cấu trúc gần nghĩa.
Khi người dùng gửi câu tiếng Hoa: dịch, giải thích cấu trúc và sửa lỗi nếu có (nói rõ vì sao).
Nếu người dùng gõ giản thể, trả lời bằng phồn thể và nhắc nhẹ dạng phồn thể.
Không bịa; nếu không chắc thì nói không chắc. Từ chối nhẹ nhàng nếu câu hỏi không liên quan đến học tiếng Hoa và đưa cuộc trò chuyện về lại việc học.
Định dạng: văn bản thường, có thể dùng **đậm** và gạch đầu dòng "- ". Không dùng bảng, không dùng tiêu đề #.`;

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
    if (!env.AI) return json({ ok: false, error: "no_ai" }, 500, h);

    let body;
    try { body = await req.json(); } catch { return json({ ok: false, error: "bad_json" }, 400, h); }
    const task = body.task === "grammar" ? "grammar" : body.task === "chat" ? "chat" : "translate";
    let q = String(body.q || "").trim().slice(0, 400);
    let msgs = null;
    if (task === "chat") {
      msgs = (Array.isArray(body.messages) ? body.messages : [])
        .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
        .slice(-12).map(m => ({ role: m.role, content: m.content.slice(0, 1500) }));
      while (msgs.length && msgs[0].role !== "user") msgs.shift();
      if (!msgs.length || msgs[msgs.length - 1].role !== "user") return json({ ok: false, error: "empty" }, 400, h);
    } else if (!q) return json({ ok: false, error: "empty" }, 400, h);
    if (await overLimit(env, req)) return json({ ok: false, error: "limit" }, 429, h);

    const system = task === "grammar" ? SYS_GRAMMAR : task === "chat" ? SYS_CHAT : SYS_TRANSLATE;
    const hint = task === "translate" && (body.dir === "zh2vi" || body.dir === "vi2zh")
      ? `\n(Hướng dịch yêu cầu: ${body.dir === "zh2vi" ? "Hán → Việt" : "Việt → Hán phồn thể"})` : "";
    try {
      const model = env.MODEL || "@cf/qwen/qwen3-30b-a3b-fp8";
      const messages = [{ role: "system", content: system + "\n/no_think" }].concat(
        task === "chat" ? msgs : [{ role: "user", content: "<input>\n" + q + "\n</input>" + hint }]);
      const r = await env.AI.run(model, {
        messages,
        max_tokens: task === "chat" ? 1200 : task === "grammar" ? 1800 : 600,
        temperature: task === "chat" ? 0.5 : 0.2,
      });
      let text = typeof r === "string" ? r : (r && (r.response || (r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content))) || "";
      text = String(text).replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      if (!text) return json({ ok: false, error: "empty_reply" }, 502, h);
      if (task === "chat") return json({ ok: true, task, data: { reply: text } }, 200, h);
      return json({ ok: true, task, data: parseModel(text) }, 200, h);
    } catch (e) {
      /* Hết hạn mức miễn phí trong ngày của Workers AI */
      if (/allocation|quota|neurons|limit|4006|rate/i.test(String((e && e.message) || e))) return json({ ok: false, error: "limit" }, 429, h);
      return json({ ok: false, error: "fail" }, 502, h);
    }
  },
};
