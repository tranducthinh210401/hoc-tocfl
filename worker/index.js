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

const SYS_CHAT = `Bạn là TILO, trợ lý ảo thân thiện của "Học TOCFL cùng Thịnh & Loan", giống một người bạn học giỏi tiếng Hoa (Quan thoại Đài Loan, chữ PHỒN THỂ) đang kèm một bạn người Việt ôn thi TOCFL.

CÁCH TRÒ CHUYỆN
- Nói như người thật: tự nhiên, ấm áp, gần gũi, xưng "mình" và gọi người dùng là "bạn". Không văn mẫu, không mở đầu kiểu "Tất nhiên!", "Chắc chắn rồi!", không lặp lại câu hỏi của người dùng.
- Trả lời ĐÚNG điều người ta hỏi trước, ngắn gọn, rồi mới bổ sung nếu thật sự có ích. Độ dài theo câu hỏi: chào hỏi/hỏi nhanh thì 1–3 câu; hỏi sâu mới giải thích dài.
- Đọc kỹ ý đồ phía sau câu chữ. Người dùng có thể gõ tắt, sai chính tả, thiếu dấu tiếng Việt, gõ pinyin không dấu (ví dụ "ni hao", "xie xie"), trộn Việt–Hoa, hoặc hỏi cộc lốc ("còn 得?", "cái này nghĩa gì"). Hãy suy luận từ ngữ cảnh các tin trước và hiểu theo nghĩa hợp lý nhất, cứ trả lời luôn; chỉ hỏi lại MỘT câu ngắn khi thật sự có hai cách hiểu khác hẳn nhau.
- Câu chuyện phiếm, cảm xúc, động viên (mệt, chán, lo thi...): đáp lại như một người bạn, chân thành, rồi nhẹ nhàng gợi ý học tiếp nếu hợp. Câu hỏi hoàn toàn ngoài tiếng Hoa: trả lời ngắn nếu đơn giản, rồi khéo kéo về việc học.
- Nhớ ngữ cảnh: "nó", "cái đó", "câu trên", "còn … thì sao" đều nói về nội dung đã trao đổi.

KHI DẠY
- TỪ VỰNG: chữ Hán phồn thể + pinyin có dấu + nghĩa tiếng Việt dễ hiểu; thêm loại từ, cấp TOCFL (nếu chắc), 1–2 ví dụ ngắn (Hán, pinyin, nghĩa Việt) và từ dễ nhầm. Không cần đủ mọi mục nếu người dùng chỉ hỏi nghĩa.
- NGỮ PHÁP: nêu cấu trúc, ý nghĩa, cách dùng bằng lời đời thường, lỗi người Việt hay mắc, ví dụ; so sánh khi có hai cấu trúc gần nghĩa.
- Người dùng gửi câu tiếng Hoa: dịch tự nhiên, giải thích ngắn chỗ đáng chú ý, sửa lỗi nếu có và nói rõ vì sao. Gõ giản thể thì trả lời bằng phồn thể và nhắc dạng phồn thể.
- Chỉ nêu điều bạn chắc. Không chắc thì nói thẳng "mình không chắc" thay vì đoán.

DỊCH TÊN NGƯỜI VIỆT SANG CHỮ HÁN
- Dịch theo âm Hán Việt, MỖI ÂM TIẾT TIẾNG VIỆT TƯƠNG ỨNG ĐÚNG MỘT CHỮ HÁN, giữ nguyên thứ tự và đủ số âm tiết (tên 4 chữ Việt thì ra 4 chữ Hán). Chữ đệm "Thị" viết là 氏, "Văn" là 文. Tuyệt đối không bỏ sót, không gộp hay thêm âm tiết.
- Họ thường gặp: Nguyễn 阮, Trần 陳, Lê 黎, Phạm 范, Hoàng/Huỳnh 黃, Phan 潘, Vũ/Võ 武, Đặng 鄧, Bùi 裴, Đỗ 杜, Hồ 胡, Ngô 吳, Dương 楊, Lý 李, Đinh 丁, Lâm 林.
- Với tên riêng có nhiều chữ Hán cùng âm (ví dụ Loan: 鸞 / 鑾; Thúy: 翠 / 翠; Lan: 蘭), chọn chữ phổ biến nhất, nói rõ ý nghĩa và cho biết còn lựa chọn khác. Nếu không chắc chữ nào đúng với tên cụ thể của người dùng thì nói là "phổ biến nhất" và nhờ họ xác nhận.
- Trước khi trả lời hãy tự đếm lại số âm tiết Việt và số chữ Hán cho khớp. Ghi rõ từng cặp âm tiết → chữ Hán → pinyin. Họ tên trong bản dịch ghi theo thứ tự Họ + Đệm + Tên.

ĐỘ CHÍNH XÁC (QUAN TRỌNG NHẤT)
- Nếu tin nhắn có phần <du_lieu_tham_khao> (lấy từ kho từ vựng TOCFL của trang), đó là dữ liệu ĐÃ KIỂM CHỨNG: hãy dùng đúng nghĩa/pinyin/ví dụ trong đó, không tự đổi, và ưu tiên hơn kiến thức của bạn.
- Chỉ khẳng định điều bạn chắc chắn. Với chữ Hán, pinyin, nghĩa, cấp TOCFL, quy tắc ngữ pháp: nếu không chắc 100% thì nói rõ "mình không chắc phần này" rồi nêu phần chắc chắn; TUYỆT ĐỐI không bịa chữ Hán, pinyin hay ví dụ cho đủ.
- Đọc kỹ câu hỏi, trả lời đúng thứ người dùng cần biết (nếu họ hỏi tên thì trả lời về tên, hỏi nghĩa thì trả lời nghĩa). Có hai cách hiểu khác hẳn nhau thì hỏi lại một câu ngắn thay vì đoán.
- Nếu có phần <tra_cuu_internet> (kết quả tra từ điển trực tuyến: 萌典 – Từ điển của Bộ Giáo dục Đài Loan, Wiktionary, hoặc tìm kiếm web), hãy dùng để kiểm chứng. 萌典 là chuẩn cho cách đọc/định nghĩa tiếng Hoa Đài Loan; nghĩa tiếng Việt ưu tiên <du_lieu_tham_khao> rồi Wiktionary tiếng Việt. Khi dùng, nhắc nguồn ngắn gọn (ví dụ "theo 萌典"). Nếu tra không thấy thì nói thẳng là chưa tra được, đừng bịa.
- Trước khi trả lời, tự kiểm tra lại: số chữ/âm tiết có khớp không, pinyin có khớp chữ Hán không, nghĩa có khớp ngữ cảnh không.

ĐỊNH DẠNG
- Viết như tin nhắn chat: văn xuôi ngắn, xuống dòng vừa phải. Chỉ dùng **đậm** cho từ khóa và gạch đầu dòng "- " khi liệt kê thật sự cần. Không bảng, không tiêu đề #. Tối đa 1–2 biểu tượng cảm xúc, dùng khi hợp.
- Ví dụ tiếng Hoa viết trên một dòng riêng: 我想喝咖啡。(wǒ xiǎng hē kāfēi) — Mình muốn uống cà phê.`;

/* ---- Tra cứu trực tuyến (không cần khóa): 萌典, Wiktionary; tuỳ chọn Tavily nếu có TAVILY_API_KEY ---- */
const HAN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+/g;
const tmo = (ms) => (typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined);

async function moedict(word) {
  for (const path of ["https://www.moedict.tw/uni/", "https://www.moedict.tw/a/"]) {
    try {
      const r = await fetch(path + encodeURIComponent(word) + ".json", { signal: tmo(3000) });
      if (!r.ok) continue;
      const d = await r.json();
      const hs = (d.heteronyms || []).slice(0, 2);
      if (!hs.length) continue;
      const lines = hs.map(h => "[" + (h.pinyin || h.bopomofo || "") + "] " + (h.definitions || []).slice(0, 3).map(x => String(x.def || "").replace(/\s+/g, " ").slice(0, 120)).join(" / "));
      return { name: "萌典 (moedict.tw)", url: "https://www.moedict.tw/" + encodeURIComponent(word), text: word + ": " + lines.join(" | ") };
    } catch (e) { /* thử đường dẫn khác */ }
  }
  return null;
}
async function wiktionary(word) {
  try {
    const u = "https://vi.wiktionary.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1&redirects=1&titles=" + encodeURIComponent(word);
    const r = await fetch(u, { signal: tmo(3000) });
    if (!r.ok) return null;
    const d = await r.json();
    const pages = d.query && d.query.pages ? Object.values(d.query.pages) : [];
    const ex = pages[0] && pages[0].extract ? String(pages[0].extract).replace(/\n{2,}/g, "\n").slice(0, 600) : "";
    if (!ex) return null;
    return { name: "Wiktionary tiếng Việt", url: "https://vi.wiktionary.org/wiki/" + encodeURIComponent(word), text: word + ": " + ex };
  } catch (e) { return null; }
}
async function tavily(env, query) {
  if (!env.TAVILY_API_KEY) return [];
  try {
    const r = await fetch("https://api.tavily.com/search", {
      method: "POST", signal: tmo(5000),
      headers: { "content-type": "application/json", Authorization: "Bearer " + env.TAVILY_API_KEY },
      body: JSON.stringify({ query, max_results: 3, search_depth: "basic" }),
    });
    if (!r.ok) return [];
    const d = await r.json();
    return (d.results || []).slice(0, 3).map(x => ({ name: x.title || "Web", url: x.url, text: String(x.content || "").slice(0, 400) }));
  } catch (e) { return []; }
}
async function lookupOnline(env, text) {
  const runs = Array.from(new Set((text.match(HAN) || []).filter(x => x.length <= 6))).slice(0, 3);
  const jobs = [];
  for (const w of runs) { jobs.push(moedict(w)); jobs.push(wiktionary(w)); }
  if (/tra (mạng|internet|web)|tìm trên (mạng|internet|web)|mới nhất|hiện nay|năm nay|202\d/i.test(text)) jobs.push(tavily(env, text).then(a => a));
  const res = (await Promise.allSettled(jobs)).map(x => x.status === "fulfilled" ? x.value : null).flat().filter(Boolean);
  return res.slice(0, 7);
}

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
    const ctx = String(body.context || "").trim().slice(0, 2500);
    let msgs = null;
    let sources = [];
    if (task === "chat") {
      msgs = (Array.isArray(body.messages) ? body.messages : [])
        .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
        .slice(-12).map(m => ({ role: m.role, content: m.content.slice(0, 1500) }));
      while (msgs.length && msgs[0].role !== "user") msgs.shift();
      if (msgs.length && msgs[msgs.length - 1].role === "user") {
        const last = msgs[msgs.length - 1];
        if (ctx) last.content += "\n\n<du_lieu_tham_khao>\n" + ctx + "\n</du_lieu_tham_khao>";
        sources = await lookupOnline(env, last.content.split("<du_lieu_tham_khao>")[0]);
        if (sources.length) last.content += "\n\n<tra_cuu_internet>\n" + sources.map(x => "- (" + x.name + ") " + x.text).join("\n") + "\n</tra_cuu_internet>";
      }
      if (!msgs.length || msgs[msgs.length - 1].role !== "user") return json({ ok: false, error: "empty" }, 400, h);
    } else if (!q) return json({ ok: false, error: "empty" }, 400, h);
    if (await overLimit(env, req)) return json({ ok: false, error: "limit" }, 429, h);

    const system = task === "grammar" ? SYS_GRAMMAR : task === "chat" ? SYS_CHAT : SYS_TRANSLATE;
    const hint = task === "translate" && (body.dir === "zh2vi" || body.dir === "vi2zh")
      ? `\n(Hướng dịch yêu cầu: ${body.dir === "zh2vi" ? "Hán → Việt" : "Việt → Hán phồn thể"})` : "";
    try {
      const models = (env.MODELS || "@cf/meta/llama-3.3-70b-instruct-fp8-fast,@cf/qwen/qwen3-30b-a3b-fp8").split(",").map(x => x.trim()).filter(Boolean);
      const messages = [{ role: "system", content: system + "\n/no_think" }].concat(
        task === "chat" ? msgs : [{ role: "user", content: "<input>\n" + q + "\n</input>" + hint }]);
      let r = null, lastErr = null;
      for (const model of models) {
        try {
          r = await env.AI.run(model, {
            messages,
            max_tokens: task === "chat" ? 1200 : task === "grammar" ? 1800 : 600,
            temperature: task === "chat" ? 0.3 : 0.2,
          });
          break;
        } catch (e) {
          lastErr = e;
          if (/allocation|quota|neurons|4006/i.test(String((e && e.message) || e))) throw e;
        }
      }
      if (r === null) throw lastErr || new Error("no model");
      let text = typeof r === "string" ? r : (r && (r.response || (r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content))) || "";
      text = String(text).replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      if (!text) return json({ ok: false, error: "empty_reply" }, 502, h);
      if (task === "chat") return json({ ok: true, task, data: { reply: text, sources: sources.map(x => ({ name: x.name, url: x.url })) } }, 200, h);
      return json({ ok: true, task, data: parseModel(text) }, 200, h);
    } catch (e) {
      /* Hết hạn mức miễn phí trong ngày của Workers AI */
      if (/allocation|quota|neurons|limit|4006|rate/i.test(String((e && e.message) || e))) return json({ ok: false, error: "limit" }, 429, h);
      return json({ ok: false, error: "fail" }, 502, h);
    }
  },
};
