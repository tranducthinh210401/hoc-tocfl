/* Trợ lý Lona — trò chuyện tiếng Hoa (phồn thể) ⇄ Việt — © 2026 Học TOCFL cùng Thịnh & Loan
   Nguồn tra cứu: (1) kho từ vựng TOCFL trong trang (chính xác nhất, có ví dụ),
   (2) Google Translate (gtx) ra zh-TW + pinyin, (3) MyMemory dự phòng. */
(function(){
'use strict';
var IMG='tro-ly-avatar.jpg?v=20261101c';
/* Địa chỉ máy chủ trung gian (xem worker/README.md). Để trống = dùng dịch miễn phí, chưa có giải thích ngữ pháp bằng AI. */
var API=(window.TRO_LY_API||'https://tro-ly-tocfl.tranducthinh210401.workers.dev').replace(/\/$/,'');
var CJK=/[㐀-䶿一-鿿豈-﫿]/;
var CJK_ALL=/^[㐀-䶿一-鿿豈-﫿]+$/;
function $(s,r){return (r||document).querySelector(s)}
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function store(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k));localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
function noDia(s){return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase()}
function cleanVi(s){return noDia(s).replace(/\([^)]*\)/g,' ').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim()}

/* ---------- CSS ---------- */
var css='\
.ta-fab{position:fixed;right:14px;bottom:14px;width:60px;height:60px;border-radius:50%;padding:0;border:3px solid #fff;background:#ffe9b0 url('+IMG+') center/cover;box-shadow:0 6px 20px rgba(0,0,0,.28);cursor:pointer;z-index:9000;touch-action:none;transition:transform .15s}\
.ta-fab:active{transform:scale(.94)}\
.ta-fab::after{content:"";position:absolute;right:1px;bottom:1px;width:13px;height:13px;border-radius:50%;background:#22c55e;border:2px solid #fff}\
.ta-lbl{position:absolute;right:-2px;bottom:calc(100% + 10px);white-space:nowrap;pointer-events:none;background:var(--surface,#fff);color:var(--text,#1d1d1f);border:1px solid var(--border,rgba(0,0,0,.1));border-radius:14px 14px 4px 14px;padding:7px 12px;font:700 12.5px system-ui,-apple-system,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.16);animation:ta-in .4s}.ta-lbl::after{content:"";position:absolute;right:22px;bottom:-6px;width:10px;height:10px;background:inherit;border-right:1px solid var(--border,rgba(0,0,0,.1));border-bottom:1px solid var(--border,rgba(0,0,0,.1));transform:rotate(45deg)}\
.ta-fab.hasnew{animation:ta-bob 2.4s ease-in-out infinite}\
@keyframes ta-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}\
.ta-tip{position:fixed;z-index:9000;background:var(--surface,#fff);color:var(--text,#1d1d1f);border:1px solid var(--border,rgba(0,0,0,.1));border-radius:14px 14px 4px 14px;padding:8px 12px;font:600 13px "Be Vietnam Pro",system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.16);max-width:200px;animation:ta-in .3s}\
@keyframes ta-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}\
.ta-panel{position:fixed;right:12px;bottom:12px;width:380px;max-width:calc(100vw - 24px);height:560px;max-height:calc(100vh - 28px);max-height:calc(100dvh - 28px);display:none;flex-direction:column;background:var(--surface,#fff);color:var(--text,#1d1d1f);border:1px solid var(--border,rgba(0,0,0,.1));border-radius:22px;box-shadow:0 18px 50px rgba(0,0,0,.28);z-index:9001;overflow:hidden;font-family:"Be Vietnam Pro",system-ui,sans-serif}\
.ta-panel.open{display:flex;animation:ta-in .22s}\
.ta-h{display:flex;align-items:center;gap:10px;padding:12px 14px;background:linear-gradient(100deg,#fff4d6,#e3f0ff);color:#1d1d1f;flex:none}\
.ta-h img{width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid #fff;flex:none}\
.ta-h b{display:block;font-size:15px;line-height:1.2}.ta-h small{display:block;font-size:11.5px;opacity:.7;margin-top:1px}\
.ta-x{margin-left:auto;border:0;background:rgba(0,0,0,.08);width:32px;height:32px;border-radius:50%;font-size:18px;line-height:1;cursor:pointer;color:inherit;flex:none}\
.ta-body{overflow:auto;padding:12px 14px;flex:1 1 auto;min-height:0;-webkit-overflow-scrolling:touch}\
.ta-modes{display:flex;gap:6px;margin-bottom:10px}\
.ta-modes button{flex:1;border:1.5px solid var(--border,rgba(0,0,0,.12));background:transparent;color:inherit;border-radius:999px;padding:7px 6px;font:600 12.5px inherit;font-family:inherit;cursor:pointer}\
.ta-modes button.on{background:var(--blue,#0071e3);border-color:var(--blue,#0071e3);color:#fff}\
.ta-in{display:flex;gap:8px;align-items:flex-end}\
.ta-in textarea{flex:1;resize:none;border:1.5px solid var(--border,rgba(0,0,0,.14));border-radius:14px;padding:10px 12px;font:500 16px/1.4 "Be Vietnam Pro","Noto Serif TC",system-ui,sans-serif;background:var(--surface-2,#fafafa);color:inherit;min-height:46px;max-height:120px;outline:none;overflow-y:auto}\
.ta-in textarea:focus{border-color:var(--blue,#0071e3)}\
.ta-go{border:0;background:var(--blue,#0071e3);color:#fff;border-radius:14px;height:46px;padding:0 16px;font:700 14px inherit;font-family:inherit;cursor:pointer;flex:none}\
.ta-go:disabled{opacity:.55}\
.ta-sw{background:none;border:0;color:var(--blue,#0071e3);font:600 12.5px inherit;font-family:inherit;cursor:pointer;padding:6px 0}\
.ta-card{margin-top:12px;border:1px solid var(--border,rgba(0,0,0,.1));border-radius:16px;padding:12px 14px;background:var(--surface-2,#fafafa)}\
.ta-card h4{margin:0 0 6px;font-size:11.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--text-tertiary,#86868b);font-weight:700}\
.ta-big{font-size:22px;line-height:1.4;font-weight:600;word-break:break-word}.ta-big.zh{font-family:var(--han-font,"Noto Serif TC",serif);font-size:26px}\
.ta-py{color:var(--blue,#0071e3);font-weight:600;font-size:15px;margin-top:2px}\
.ta-note{font-size:12px;color:var(--text-tertiary,#86868b);margin-top:6px}\
.ta-row{display:flex;gap:8px;align-items:flex-start;justify-content:space-between}\
.ta-ic{border:1px solid var(--border,rgba(0,0,0,.12));background:var(--surface,#fff);color:inherit;border-radius:10px;width:34px;height:34px;cursor:pointer;font-size:15px;flex:none}\
.ta-ent{padding:8px 0;border-top:1px solid var(--border-soft,rgba(0,0,0,.07))}.ta-ent:first-of-type{border-top:0;padding-top:0}\
.ta-ent .h{font-family:var(--han-font,"Noto Serif TC",serif);font-size:20px;font-weight:600}\
.ta-ent .p{color:var(--blue,#0071e3);font-weight:600;font-size:13.5px;margin-left:6px}\
.ta-ent .t{display:inline-block;font-size:10.5px;font-weight:700;background:var(--blue-tint,rgba(0,113,227,.1));color:var(--blue,#0071e3);border-radius:6px;padding:1px 6px;margin-left:6px}\
.ta-ent .m{font-size:14px;margin-top:2px}.ta-ent .e{font-size:13px;color:var(--text-secondary,#6e6e73);margin-top:3px}.ta-ent .e i{font-style:normal;font-family:var(--han-font,serif);color:var(--text,#1d1d1f)}\
.ta-seg{display:flex;flex-wrap:wrap;gap:6px}.ta-seg span{background:var(--surface,#fff);border:1px solid var(--border,rgba(0,0,0,.1));border-radius:10px;padding:4px 8px;text-align:center;line-height:1.25}\
.ta-seg b{display:block;font-family:var(--han-font,serif);font-size:18px}.ta-seg small{display:block;font-size:11px;color:var(--blue,#0071e3)}.ta-seg em{display:block;font-style:normal;font-size:11.5px;color:var(--text-secondary,#6e6e73);max-width:110px}\
.ta-hist{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.ta-hist button{border:1px solid var(--border,rgba(0,0,0,.1));background:var(--surface-2,#fafafa);color:inherit;border-radius:999px;padding:5px 11px;font:500 13px inherit;font-family:inherit;cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\
.ta-gram{width:100%;margin-top:12px;border:1.5px solid var(--blue,#0071e3);background:transparent;color:var(--blue,#0071e3);border-radius:14px;padding:11px;font:700 14px inherit;font-family:inherit;cursor:pointer}.ta-gram:disabled{opacity:.55}\
.ta-sp{border:0;background:var(--blue-tint,rgba(0,113,227,.1));color:inherit;border-radius:50%;width:28px;height:28px;font-size:13px;cursor:pointer;margin-left:6px;vertical-align:middle;padding:0}\
.ta-qline{display:flex;align-items:center;margin-bottom:8px}.ta-qh{font-family:var(--han-font,serif);font-size:24px;font-weight:700;word-break:break-word}\
.ta-tabs{display:flex;gap:6px;padding:8px 14px 0;flex:none}.ta-tabs button{flex:1;border:0;border-bottom:3px solid transparent;background:none;color:var(--text-secondary,#6e6e73);font:700 13.5px inherit;font-family:inherit;padding:8px 4px;cursor:pointer}.ta-tabs button.on{color:var(--blue,#0071e3);border-color:var(--blue,#0071e3)}\
.ta-chat{display:flex;flex-direction:column;flex:1 1 auto;min-height:0}.ta-chat[hidden]{display:none}\
.ta-msgs{flex:1 1 auto;min-height:0;overflow:auto;padding:12px 14px;display:flex;flex-direction:column;gap:10px;-webkit-overflow-scrolling:touch}\
.ta-spi{width:22px!important;height:22px!important;font-size:11px!important;margin:0 3px 0 2px!important;vertical-align:baseline!important}.ta-m{max-width:94%;padding:9px 13px;border-radius:18px;font-size:14.5px;line-height:1.5;word-break:break-word;white-space:pre-wrap}\
.ta-m.u{align-self:flex-end;background:var(--blue,#0071e3);color:#fff;border-bottom-right-radius:5px}\
.ta-m.a{align-self:flex-start;background:var(--surface-2,#f2f2f5);border:1px solid var(--border-soft,rgba(0,0,0,.07));border-bottom-left-radius:5px}\
.ta-m.a .zh{font-family:var(--han-font,"Noto Serif TC",serif);font-weight:600;cursor:pointer;border-bottom:1px dotted var(--blue,#0071e3)}\
.ta-sug{display:flex;gap:6px;overflow-x:auto;padding:0 14px 8px;flex:none}.ta-sug button{flex:none;border:1px solid var(--border,rgba(0,0,0,.12));background:var(--surface-2,#fafafa);color:inherit;border-radius:999px;padding:6px 12px;font:500 12.5px inherit;font-family:inherit;cursor:pointer;white-space:nowrap}\
.ta-cin{padding:8px 14px 10px;border-top:1px solid var(--border-soft,rgba(0,0,0,.07));flex:none}\
.ta-dict{display:flex;flex-direction:column}.ta-dict[hidden]{display:none}.ta-out{flex:1 0 auto;display:flex;flex-direction:column}.ta-out>.ta-main{flex:1 0 auto;margin-bottom:4px}\
.ta-clrh{border-style:dashed!important;color:var(--text-secondary,#6e6e73)!important}\
.ta-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8px;padding:24px 18px}.ta-eico{font-size:40px;line-height:1}.ta-etit{font-weight:800;font-size:16px}.ta-esub{font-size:13px;color:var(--text-secondary,#6e6e73);max-width:280px;line-height:1.5}.ta-ech{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:8px}.ta-ech button{border:1px solid var(--border,rgba(0,0,0,.12));background:var(--surface,#fff);color:inherit;border-radius:999px;padding:7px 14px;font:600 14px inherit;font-family:var(--han-font,serif);cursor:pointer}\
.ta-src{margin-top:6px;font-size:11.5px;color:var(--text-tertiary,#86868b);white-space:normal}.ta-src a{color:var(--blue,#0071e3)}\
.ta-err{color:#c2410c;font-size:13.5px;margin-top:10px}\
.ta-foot{flex:none;text-align:center;font-size:11px;color:var(--text-tertiary,#86868b);padding:6px 10px 9px;border-top:1px solid var(--border-soft,rgba(0,0,0,.07))}\
.ta-dots{display:inline-block}.ta-dots::after{content:"…";animation:ta-bob 1s infinite}\
@media (max-width:700px){.ta-panel{inset:0;width:auto;max-width:none;max-height:none;height:100%;border-radius:0;border:0}.ta-h{padding-top:calc(12px + env(safe-area-inset-top,0px))}.ta-foot{padding-bottom:calc(9px + env(safe-area-inset-bottom,0px))}}\
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .ta-h{background:linear-gradient(100deg,#3a3320,#1f2f46);color:#f5f5f7}}\
html[data-theme="dark"] .ta-h{background:linear-gradient(100deg,#3a3320,#1f2f46);color:#f5f5f7}\
html[data-theme="dark"] .ta-x{background:rgba(255,255,255,.14)}\
.ta-panel{width:420px;height:640px;border-radius:26px;border:1px solid var(--border,rgba(0,0,0,.08));box-shadow:0 24px 64px rgba(20,20,40,.28),0 2px 8px rgba(0,0,0,.08)}\
.ta-h{position:relative;padding:14px 16px;gap:12px;background:linear-gradient(115deg,#0071e3 0%,#4f46e5 60%,#8b5cf6 100%);color:#fff}\
.ta-h::after{content:"";position:absolute;right:-30px;top:-40px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.12);pointer-events:none}\
.ta-h img{width:46px;height:46px;border:2.5px solid rgba(255,255,255,.9);box-shadow:0 2px 8px rgba(0,0,0,.2)}\
.ta-ht{position:relative}.ta-ht::before{content:"";position:absolute;left:-14px;bottom:2px;width:11px;height:11px;border-radius:50%;background:#34d399;border:2px solid #4f46e5;display:none}\
.ta-h b{font-size:16px;font-weight:800;letter-spacing:.01em}\
.ta-h small{opacity:.88;font-size:12px;display:flex;align-items:center;gap:5px}.ta-h small::before{content:"";width:7px;height:7px;border-radius:50%;background:#34d399;box-shadow:0 0 0 3px rgba(52,211,153,.3)}\
.ta-h .ta-x{background:rgba(255,255,255,.18);color:#fff;width:34px;height:34px;position:relative;z-index:1;transition:background .15s}.ta-h .ta-x:hover{background:rgba(255,255,255,.3)}\
.ta-msgs{padding:16px 16px 8px;gap:12px;background:var(--bg,#f5f5f7);scroll-behavior:smooth}\
.ta-m{max-width:88%;padding:10px 14px;font-size:15px;line-height:1.55;box-shadow:0 1px 2px rgba(0,0,0,.06)}\
.ta-m.u{background:linear-gradient(135deg,#0071e3,#4f46e5);border-radius:20px 20px 6px 20px;box-shadow:0 3px 10px rgba(79,70,229,.3)}\
.ta-m.a{background:var(--surface,#fff);border:1px solid var(--border-soft,rgba(0,0,0,.06));border-radius:20px 20px 20px 6px;position:relative;margin-left:0}\
.ta-m.a b{font-weight:700}\
.ta-m.a .zh{font-size:1.08em;color:var(--blue,#0071e3);border-bottom:0;background:var(--blue-tint,rgba(0,113,227,.08));border-radius:6px;padding:0 4px}\
.ta-m{animation:ta-in .25s}\
.ta-spi{background:var(--blue,#0071e3)!important;color:#fff!important;width:24px!important;height:24px!important;font-size:11px!important;margin:0 4px 0 2px!important;box-shadow:0 1px 4px rgba(0,113,227,.4);transition:transform .12s}.ta-spi:active{transform:scale(.9)}\
.ta-sug{padding:8px 16px 10px;background:var(--bg,#f5f5f7);scrollbar-width:none}.ta-sug::-webkit-scrollbar{display:none}\
.ta-sug button{background:var(--surface,#fff);border:1px solid var(--border,rgba(0,0,0,.1));box-shadow:0 1px 2px rgba(0,0,0,.05);font-weight:600;color:var(--blue,#0071e3);transition:background .15s,transform .1s}.ta-sug button:hover{background:var(--blue-tint,rgba(0,113,227,.08))}.ta-sug button:active{transform:scale(.97)}\
.ta-cin{padding:10px 14px 12px;align-items:flex-end;gap:8px;border-top:1px solid var(--border-soft,rgba(0,0,0,.07));background:var(--surface,#fff)}\
.ta-cin textarea{border-radius:22px;padding:11px 16px;min-height:46px;background:var(--bg,#f5f5f7);border:1.5px solid transparent;font-size:15.5px;transition:border-color .15s,background .15s}.ta-cin textarea:focus{background:var(--surface,#fff);border-color:var(--blue,#0071e3);box-shadow:0 0 0 4px rgba(0,113,227,.12)}\
.ta-cin .ta-go{width:46px;height:46px;padding:0;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0071e3,#4f46e5);box-shadow:0 3px 10px rgba(79,70,229,.35);transition:transform .12s,opacity .15s}.ta-cin .ta-go:active{transform:scale(.92)}.ta-cin .ta-go:disabled{opacity:.45;box-shadow:none}\
.ta-foot{background:var(--surface,#fff);border-top:0;padding:0 10px 10px;font-size:11px}\
.ta-fab{width:64px;height:64px;box-shadow:0 8px 24px rgba(79,70,229,.4),0 2px 6px rgba(0,0,0,.18)}\
.ta-lbl{background:linear-gradient(135deg,#0071e3,#4f46e5);color:#fff;border:0;box-shadow:0 8px 22px rgba(79,70,229,.4)}\
@media (max-width:700px){.ta-panel{inset:0;width:auto;max-width:none;height:100%;max-height:none;border-radius:0;border:0}.ta-h{padding-top:calc(14px + env(safe-area-inset-top,0px))}.ta-m{font-size:15.5px}}\
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .ta-h{background:linear-gradient(115deg,#0a4f9e,#3730a3 60%,#6d28d9);color:#fff}:root:not([data-theme="light"]) .ta-m.a .zh{color:#7db8ff}}\
html[data-theme="dark"] .ta-h{background:linear-gradient(115deg,#0a4f9e,#3730a3 60%,#6d28d9);color:#fff}html[data-theme="dark"] .ta-m.a .zh{color:#7db8ff}';
var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

/* ---------- Từ điển nội bộ (kho TOCFL trong trang) ---------- */
var IDX=null;
function buildIdx(){
  if(IDX)return IDX;
  IDX={han:Object.create(null),list:[],max:1};
  var D;try{D=(typeof DATA!=='undefined')?DATA:[]}catch(e){D=[]}
  D.forEach(function(w){
    if(!w||w.type!=='word'||!w.han)return;
    var forms=String(w.han).split(/[\/、,，;；]/).map(function(x){return x.replace(/[（(][^)）]*[)）]/g,'').trim()});
    forms.forEach(function(f){
      if(!f||!CJK_ALL.test(f))return;
      (IDX.han[f]=IDX.han[f]||[]).push(w);
      if(f.length>IDX.max)IDX.max=Math.min(f.length,8);
    });
    IDX.list.push(w);
  });
  return IDX;
}
function simplifyEntries(arr){var seen={},out=[];arr.forEach(function(w){var k=w.han+'|'+w.nghia;if(seen[k])return;seen[k]=1;out.push(w)});return out}
function lookupHan(q){var I=buildIdx();return simplifyEntries(I.han[q]||[])}
function containsHan(q,limit){
  var I=buildIdx(),out=[];
  for(var i=0;i<I.list.length&&out.length<limit;i++){var w=I.list[i];if(w.han!==q&&String(w.han).indexOf(q)>=0)out.push(w)}
  return simplifyEntries(out);
}
function searchVi(q,limit){
  var I=buildIdx(),n=cleanVi(q);if(!n)return[];
  var exact=[],start=[],has=[];
  I.list.forEach(function(w){
    var parts=String(w.nghia||'').split(/[;,\/]/).map(cleanVi).filter(Boolean),full=cleanVi(w.nghia);
    if(parts.indexOf(n)>=0||full===n)exact.push(w);
    else if(parts.some(function(p){return p.indexOf(n+' ')===0}))start.push(w);
    else if((' '+full+' ').indexOf(' '+n+' ')>=0)has.push(w);
  });
  return simplifyEntries(exact.concat(start,has)).slice(0,limit);
}
function segment(text){
  var I=buildIdx(),out=[],i=0;
  while(i<text.length){
    var ch=text[i];
    if(!CJK.test(ch)){var j=i;while(j<text.length&&!CJK.test(text[j]))j++;out.push({t:text.slice(i,j)});i=j;continue}
    var found=null;
    for(var L=Math.min(I.max,text.length-i);L>=1;L--){
      var s=text.substr(i,L);if(I.han[s]){found={t:s,w:I.han[s][0]};break}
    }
    if(found){out.push(found);i+=found.t.length}else{out.push({t:ch});i++}
  }
  return out;
}
function shortMeaning(w){return String(w.nghia||'').replace(/\s*\(.*$/,'').split(/[;]/)[0].slice(0,40)}

/* ---------- Dịch trực tuyến ---------- */
var cache={};
function fetchJ(url,signal){return fetch(url,{signal:signal}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})}
function gtx(q,sl,tl,signal){
  var key=sl+tl+q;if(cache[key])return Promise.resolve(cache[key]);
  var u='https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&dt=rm&dt=bd&dj=0&sl='+sl+'&tl='+tl+'&q='+encodeURIComponent(q);
  return fetchJ(u,signal).then(function(d){
    var segs=d[0]||[],text='',translit='';
    segs.forEach(function(s){
      if(s[0])text+=s[0];
      else if(s[2]||s[3])translit+=(s[3]||s[2]||'')+' ';
    });
    var alts=[];
    (d[1]||[]).forEach(function(g){(g[2]||[]).slice(0,4).forEach(function(a){if(a[0])alts.push(a[0])})});
    var r={text:text.trim(),translit:translit.trim(),alts:alts.slice(0,6),sl:d[2]};
    if(!r.text)throw new Error('empty');
    cache[key]=r;return r;
  });
}
function mymemory(q,from,to,signal){
  var u='https://api.mymemory.translated.net/get?q='+encodeURIComponent(q)+'&langpair='+from+'|'+to;
  return fetchJ(u,signal).then(function(d){
    var t=d&&d.responseData&&d.responseData.translatedText;
    if(!t||/MYMEMORY WARNING|INVALID/i.test(t))throw new Error('mm');
    return {text:t,translit:'',alts:[]};
  });
}
function apiCall(task,q,dir,signal){
  return fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task:task,q:q,dir:dir}),signal:signal})
    .then(function(r){return r.json().catch(function(){return {ok:false,error:'http_'+r.status}})})
    .then(function(j){if(!j||!j.ok||!j.data){var e=new Error((j&&j.error)||'api');e.code=j&&j.error;throw e}return j.data});
}
function translate(q,dir,signal){
  var sl=dir==='zh2vi'?'zh-TW':'vi',tl=dir==='zh2vi'?'vi':'zh-TW';
  var first=API?apiCall('translate',q,dir,signal).then(function(d){
    if(!d.translation)throw new Error('empty');
    return {text:String(d.translation),translit:String(d.pinyin||''),alts:(d.alternatives||[]).map(String).slice(0,6),trad:d.traditional?String(d.traditional):'',note:d.note?String(d.note):'',ai:true};
  }):Promise.reject(new Error('noapi'));
  return first.catch(function(e){
    if(e&&e.name==='AbortError')throw e;
    return gtx(q,sl,tl,signal)}).catch(function(e){
    if(e&&e.name==='AbortError')throw e;
    return mymemory(q,sl,tl,signal);
  });
}

/* ---------- Giọng đọc ---------- */
var aud=null;
function speak(txt,btn){
  txt=String(txt||'').trim();if(!txt)return;
  var b=btn&&btn.classList?btn:document.createElement('button');
  /* Dùng đúng bộ phát âm của trang (Google Dịch, tự chuyển sang giọng zh-TW của máy nếu bị chặn) */
  try{if(typeof playWord==='function'){playWord(txt,b,{});return}}catch(e){}
  try{if(aud){aud.pause();aud=null}}catch(e){}
  aud=new Audio('https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=zh-TW&q='+encodeURIComponent(txt));
  aud.play().catch(function(){
    try{var s=new SpeechSynthesisUtterance(txt);s.lang='zh-TW';speechSynthesis.cancel();speechSynthesis.speak(s)}catch(e){}
  });
}

/* ---------- Giao diện ---------- */
var fab=document.createElement('button');fab.className='ta-fab';fab.type='button';fab.title='Trợ lý ảo Lona';fab.setAttribute('aria-label','Mở trợ lý ảo Lona');
fab.innerHTML='<span class="ta-lbl">'+(window.ACC_GATE&&!window.ACC_GATE.pro?'🔒 ':'')+'Trò chuyện với Lona</span>';
document.body.appendChild(fab);
var panel=document.createElement('div');panel.className='ta-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Trợ lý ảo Lona');
panel.innerHTML='<div class="ta-h"><img src="'+IMG+'" alt=""><div class="ta-ht"><b>Trợ lý ảo Lona</b><small>Trực tuyến · hỏi gì cũng được</small></div><button class="ta-x" type="button" aria-label="Đóng">×</button></div>'

 +'<div class="ta-body ta-dict"><div class="ta-modes"><button type="button" data-m="auto" class="on">Tự nhận</button><button type="button" data-m="zh2vi">繁 → Việt</button><button type="button" data-m="vi2zh">Việt → 繁</button></div>'
 +'<div class="ta-in"><textarea rows="1" placeholder="Gõ chữ Hán / tiếng Việt…" enterkeyhint="search"></textarea><button class="ta-go" type="button">Dịch</button></div>'
 +'<div class="ta-out"></div><div class="ta-hist"></div></div>'
 +'<div class="ta-chat" hidden><div class="ta-msgs"></div><div class="ta-sug"></div><div class="ta-in ta-cin"><textarea rows="1" placeholder="Nhắn cho Lona…" enterkeyhint="send"></textarea><button class="ta-go" type="button" aria-label="Gửi"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button></div></div>'
 +'<div class="ta-foot">© 2026 Học TOCFL cùng Thịnh &amp; Loan</div>';
document.body.appendChild(panel);
var ta=$('textarea',panel),out=$('.ta-out',panel),go=$('.ta-go',panel),histEl=$('.ta-hist',panel);
var mode='auto',ctrl=null,hist=store('ta_hist')||[];

function place(){
  var bar=document.querySelector('.tabs'),b=14;
  if(bar){var r=bar.getBoundingClientRect();if(r.width>window.innerWidth*.6&&r.top>window.innerHeight*.5&&r.height>0)b=Math.round(window.innerHeight-r.top)+14}
  var pos=store('ta_pos');
  fab.style.bottom=(pos&&typeof pos.b==='number'?Math.max(b,pos.b):b)+'px';
  fab.style.right=(pos&&typeof pos.r==='number'?pos.r:14)+'px';
}
place();addEventListener('resize',place);
setTimeout(place,1500);

/* kéo thả nút (nhấn giữ rồi kéo) để không che nội dung */
(function(){
  var sx,sy,sb,sr,drag=false,moved=false;
  fab.addEventListener('pointerdown',function(e){sx=e.clientX;sy=e.clientY;sb=parseFloat(fab.style.bottom)||14;sr=parseFloat(fab.style.right)||14;drag=true;moved=false;try{fab.setPointerCapture(e.pointerId)}catch(x){}});
  fab.addEventListener('pointermove',function(e){
    if(!drag)return;var dx=e.clientX-sx,dy=e.clientY-sy;
    if(!moved&&Math.abs(dx)+Math.abs(dy)<8)return;moved=true;
    fab.style.right=Math.min(innerWidth-64,Math.max(4,sr-dx))+'px';fab.style.bottom=Math.min(innerHeight-64,Math.max(4,sb-dy))+'px';
  });
  fab.addEventListener('pointerup',function(){
    drag=false;
    if(moved){store('ta_pos',{b:parseFloat(fab.style.bottom),r:parseFloat(fab.style.right)});setTimeout(function(){moved=false},0)}
  });
  fab.addEventListener('click',function(e){if(moved){e.preventDefault();return}toggle(true)});
})();

function toggle(o){
  if(o&&window.ACC_GATE&&!window.ACC_GATE.pro){window.ACC_GATE.upsell('lona');return}
  panel.classList.toggle('open',o);fab.style.display=o?'none':'';
  var t=$('.ta-tip');if(t)t.remove();
  if(o){setTimeout(function(){try{cta.focus()}catch(e){}},60)}
}
$('.ta-x',panel).addEventListener('click',function(){toggle(false)});
document.addEventListener('pointerdown',function(e){
  if(!panel.classList.contains('open'))return;
  var t=e.target;if(panel.contains(t)||fab.contains(t))return;
  toggle(false);
},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&panel.classList.contains('open'))toggle(false)});
panel.querySelectorAll('.ta-modes button').forEach(function(b){b.addEventListener('click',function(){
  mode=b.dataset.m;panel.querySelectorAll('.ta-modes button').forEach(function(x){x.classList.toggle('on',x===b)});if(ta.value.trim())run();
})});
function autosize(){ta.style.height='auto';ta.style.height=Math.min(120,ta.scrollHeight)+'px'}
ta.addEventListener('input',autosize);
ta.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();run()}});
go.addEventListener('click',run);

function renderHist(){
  histEl.innerHTML=hist.length?hist.map(function(h,i){return '<button type="button" data-i="'+i+'">'+esc(h)+'</button>'}).join('')+'<button type="button" class="ta-clrh">🗑 Xóa lịch sử tra</button>':'';
  histEl.querySelectorAll('button[data-i]').forEach(function(b){b.addEventListener('click',function(){ta.value=hist[+b.dataset.i];autosize();run()})});
  var ch=$('.ta-clrh',histEl);if(ch)ch.onclick=clearLookup;
}
var EX=['你好','謝謝','圖書館','xin chào','cảm ơn','đẹp'];
function emptyState(){
  out.innerHTML='<div class="ta-card ta-main ta-empty"><div class="ta-eico">📖</div><div class="ta-etit">Tra từ điển Hán ⇄ Việt</div><div class="ta-esub">Gõ chữ Hán phồn thể hoặc tiếng Việt vào ô phía trên, kết quả sẽ hiện ở đây kèm pinyin, ví dụ và phát âm.</div><div class="ta-ech">'+EX.map(function(x){return '<button type="button" data-q="'+esc(x)+'">'+esc(x)+'</button>'}).join('')+'</div></div>';
  out.querySelectorAll('.ta-ech button').forEach(function(b){b.onclick=function(){ta.value=b.dataset.q;autosize();run()}});
}
function clearLookup(){
  if(ctrl)ctrl.abort();hist=[];store('ta_hist',[]);ta.value='';autosize();emptyState();go.disabled=false;renderHist();
}
function pushHist(q){hist=[q].concat(hist.filter(function(x){return x!==q})).slice(0,12);store('ta_hist',hist);renderHist()}

function entryHtml(w){
  var ex=(w.examples&&w.examples[0])||null;
  return '<div class="ta-ent"><span class="h">'+esc(w.han)+'</span><button class="ta-sp" type="button" data-say="'+esc(String(w.han).replace(/[^\u3400-\u9fff]/g,'')||w.han)+'" aria-label="Nghe">🔊</button><span class="p">'+esc(w.pinyin||'')+'</span>'+(w.tocfl?'<span class="t">'+esc(w.tocfl.replace('TOCFL ',''))+'</span>':'')
   +(w.wordTypeLabel&&w.wordTypeLabel!=='Ngữ pháp'?'<span class="t" style="background:transparent;color:inherit;opacity:.7">'+esc(w.wordTypeLabel)+'</span>':'')
   +'<div class="m">'+esc(w.nghia)+'</div>'
   +(ex?'<div class="e"><i>'+esc(ex.han)+'</i> — '+esc(ex.vi||'')+'</div>':'')+'</div>';
}
function speakBtn(t){return '<button class="ta-ic" type="button" data-say="'+esc(t)+'" aria-label="Nghe">🔊</button>'}
function copyBtn(t){return '<button class="ta-ic" type="button" data-copy="'+esc(t)+'" aria-label="Sao chép">⧉</button>'}

function bindOut(){
  out.querySelectorAll('[data-say]').forEach(function(b){b.onclick=function(e){e.stopPropagation();speak(b.dataset.say,b)}});
  out.querySelectorAll('[data-copy]').forEach(function(b){b.onclick=function(){
    var t=b.dataset.copy;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){b.textContent='✓'},function(){try{ta.value=t}catch(e){}});setTimeout(function(){b.textContent='⧉'},1200)}});
  out.querySelectorAll('[data-q]').forEach(function(b){b.onclick=function(){ta.value=b.dataset.q;autosize();run()}});
}

function detect(q){
  if(mode!=='auto')return mode;
  var han=(q.match(/[㐀-䶿一-鿿豈-﫿]/g)||[]).length;
  return han>0&&han>=q.replace(/\s/g,'').length*0.3?'zh2vi':'vi2zh';
}

function localGrammar(zh){
  var I=buildIdx(),out=[];
  I.list.forEach(function(w){
    if(out.length>=5||!(w.wordType==='Ngữ pháp'||/^\[GP\]/.test(w.lesson||'')))return;
    var ch=String(w.han).split(/[^\u3400-\u9fff]+/).filter(Boolean);
    if(ch.length&&ch.every(function(c){return zh.indexOf(c)>=0}))out.push(w);
  });
  return simplifyEntries(out);
}
function grammarHtml(d){
  var h='<div class="ta-card"><h4>Giải thích ngữ pháp (AI)</h4>';
  if(d.summary)h+='<div style="font-size:14px;margin-bottom:6px">'+esc(d.summary)+'</div>';
  if(d.breakdown&&d.breakdown.length)h+='<div class="ta-seg" style="margin:6px 0 10px">'+d.breakdown.map(function(b){
    return '<span><b>'+esc(b.han)+'</b><small>'+esc(b.pinyin||'')+'</small><em>'+esc(b.vi||'')+(b.role?' · '+esc(b.role):'')+'</em></span>'}).join('')+'</div>';
  (d.points||[]).forEach(function(p){
    h+='<div class="ta-ent"><span class="h">'+esc(p.pattern||'')+'</span>'+(p.level?'<span class="t">'+esc(p.level)+'</span>':'')
     +'<div class="m">'+esc(p.explain||'')+'</div>'
     +(p.mistake?'<div class="e">⚠️ '+esc(p.mistake)+'</div>':'')
     +(p.examples||[]).map(function(x){return '<div class="e"><i>'+esc(x.han)+'</i> <span style="color:var(--blue,#0071e3)">'+esc(x.pinyin||'')+'</span> — '+esc(x.vi||'')+'</div>'}).join('')+'</div>';
  });
  return h+'</div>';
}
function grammar(zh,btn){
  var box=$('.ta-gout',out);if(!box)return;
  var loc=localGrammar(zh);
  var locHtml=loc.length?'<div class="ta-card"><h4>Mẫu ngữ pháp trong kho “100 ngữ pháp”</h4>'+loc.map(entryHtml).join('')+'</div>':'';
  if(!API){
    box.innerHTML=locHtml+'<div class="ta-note" style="margin:8px 4px">'+(loc.length?'':'Chưa tìm thấy mẫu ngữ pháp trùng trong kho. ')+'Giải thích chi tiết bằng AI sẽ bật khi kết nối máy chủ (xem worker/README.md).</div>';return;
  }
  btn.disabled=true;box.innerHTML=locHtml+'<div class="ta-card"><h4>Đang phân tích ngữ pháp <span class="ta-dots"></span></h4></div>';
  apiCall('grammar',zh,'',null).then(function(d){box.innerHTML=locHtml+grammarHtml(d)})
   .catch(function(e){box.innerHTML=locHtml+'<div class="ta-err">'+(e&&e.code==='limit'?'Hôm nay bạn đã dùng hết lượt giải thích. Mai thử lại nhé.':'Chưa giải thích được lúc này, thử lại sau giây lát nhé.')+'</div>'})
   .then(function(){btn.disabled=false});
}

function run(){
  var q=ta.value.trim().slice(0,500);if(!q)return;
  if(ctrl)ctrl.abort();ctrl=new AbortController();var my=ctrl;
  var dir=detect(q),local=[],extra=[];
  if(dir==='zh2vi'){local=lookupHan(q);if(!local.length&&q.length<=4)extra=containsHan(q,8)}
  else{local=searchVi(q,10)}
  /* Có trong kho TOCFL: chỉ hiện đúng một khung này */
  if(local.length||extra.length){
    out.innerHTML='<div class="ta-card ta-main"><h4>'+(local.length?'Trong kho từ vựng TOCFL':'Từ chứa “'+esc(q)+'” trong kho TOCFL')+'</h4>'+(local.length?local:extra).map(entryHtml).join('')+'</div>';
    bindOut();pushHist(q);go.disabled=false;return;
  }
  /* Không có: chữ Hán + chưa nối AI -> báo rõ thay vì hiện bản dịch máy sai */
  if(dir==='zh2vi'&&!API){
    out.innerHTML='<div class="ta-card ta-main"><h4>Chưa có trong kho TOCFL</h4><div class="ta-note" style="font-size:14px">Từ/câu này chưa có trong kho từ vựng. Khi kết nối máy chủ AI, trợ lý sẽ dịch và giải thích ở đây và ở tab “Trò chuyện”.</div></div>';
    pushHist(q);go.disabled=false;return;
  }
  go.disabled=true;
  out.innerHTML='<div class="ta-card ta-main"><h4>Đang dịch <span class="ta-dots"></span></h4></div>';
  translate(q,dir,my.signal).then(function(r){
    if(my!==ctrl)return;
    var h;
    if(dir==='zh2vi'){
      h='<div class="ta-card ta-main"><h4>Nghĩa tiếng Việt</h4><div class="ta-row"><div><div class="ta-big">'+esc(r.text)+'</div>'
       +(r.translit?'<div class="ta-py">'+esc(r.translit)+'</div>':'')
       +'</div><div style="display:flex;gap:6px">'+speakBtn(q)+copyBtn(r.text)+'</div></div>'
       +(r.alts.length?'<div class="ta-note">Nghĩa khác: '+r.alts.map(esc).join(' · ')+'</div>':'')+(r.note?'<div class="ta-note">'+esc(r.note)+'</div>':'')+'</div>';
    }else{
      h='<div class="ta-card ta-main"><h4>Chữ Hán phồn thể (Đài Loan)</h4><div class="ta-row"><div><div class="ta-big zh">'+esc(r.text)+'</div>'
       +(r.translit?'<div class="ta-py">'+esc(r.translit)+'</div>':'')
       +'</div><div style="display:flex;gap:6px">'+speakBtn(r.text)+copyBtn(r.text)+'</div></div>'
       +(r.alts.length?'<div class="ta-note">Cách nói khác: '+r.alts.map(function(a){return '<a href="#" data-q="'+esc(a)+'" style="color:inherit">'+esc(a)+'</a>'}).join(' · ')+'</div>':'')+(r.note?'<div class="ta-note">'+esc(r.note)+'</div>':'')+'</div>';
    }
    out.innerHTML=h+'<div class="ta-note" style="margin:8px 4px 0">Bản dịch máy chỉ để tham khảo.</div>';
    bindOut();pushHist(q);
  }).catch(function(e){
    if(e&&e.name==='AbortError')return;
    if(my!==ctrl)return;
    out.innerHTML='<div class="ta-err">Chưa dịch được (cần Internet hoặc dịch vụ đang bận). Bạn thử lại sau giây lát nhé.</div>';
  }).then(function(){if(my===ctrl)go.disabled=false});
}

/* ---------- Trò chuyện ---------- */
var chatEl=$('.ta-chat',panel),dictEl=$('.ta-dict',panel),msgsEl=$('.ta-msgs',panel),cta=$('textarea',chatEl),cgo=$('.ta-go',chatEl),sugEl=$('.ta-sug',panel);
var convo=(store('ta_chat')||[]).filter(function(m){return m&&typeof m.content==='string'&&(m.role==='user'||m.role==='assistant')}).slice(-20),busy=false;
var SUG=['Chào buổi sáng là gì?','早安是什麼意思？','Phân biệt 的、得、地','Giải thích câu 把','「想」和「要」khác nhau thế nào?','Cho mình ví dụ với 雖然…但是…','Dịch giúp: 我昨天去夜市吃了臭豆腐。'];
/* ---------- Trả lời dạng thẻ (Cấu trúc · Câu mẫu · Lưu ý · Hỏi tiếp) ---------- */
var ZH='㐀-䶿一-鿿豈-﫿',ZHP='，。！？：；「」『』…～、';
var ZH_ANY=new RegExp('['+ZH+']'),ZH_RUN=new RegExp('(['+ZH+'][' +ZH+ZHP+']*)','g');
var SEC={'cấu trúc':'struct','công thức':'struct','nghĩa':'mean','ý nghĩa':'mean','ý nghĩa & khi nào dùng':'mean','khi nào dùng':'mean','ví dụ':'ex','ví dụ minh họa':'ex','ví dụ minh hoạ':'ex','câu mẫu':'ex','lưu ý':'note','lỗi hay gặp':'note','lỗi hay gặp / so sánh':'note','so sánh':'note','mẹo nhớ':'note','mẹo':'note','đồng nghĩa':'syn','trái nghĩa':'ant','hỏi tiếp':'follow','gợi ý hỏi tiếp':'follow'};
var SEC_T={struct:'Cấu trúc',mean:'Ý nghĩa',ex:'Câu mẫu',note:'Lưu ý',syn:'Đồng nghĩa',ant:'Trái nghĩa'};
function zhSpan(m){var say=m.replace(new RegExp('['+ZHP+']','g'),'');return say?'<span class="zh" data-say="'+say+'">'+m+'</span>':m}
function inl(t){   /* **đậm**, chữ Hán bấm để nghe, /pinyin/ giữ nguyên dấu gạch chéo */
  var h=esc(t).replace(/\*\*([^*\n]+)\*\*/g,'<b>$1</b>').replace(/`([^`\n]+)`/g,'$1');
  h=h.replace(/(^|[\s(（—-])\/([^\/<>\n]{1,80}?)\/(?=$|[\s,.;:)）—-])/g,function(m,p,py){return p+'<span class="py">/'+py+'/</span>'});
  return h.replace(/<b>([^<]*)<\/b>|(?:<span class="py">[^<]*<\/span>)|([㐀-䶿一-鿿豈-﫿][㐀-䶿一-鿿豈-﫿，。！？：；「」『』…～、]*)/g,function(m,bold,zh){
    if(zh)return zhSpan(zh);
    if(bold!==undefined)return '<b>'+bold.replace(ZH_RUN,zhSpan)+'</b>';
    return m;
  });
}
function spkBtn(say){return '<button type="button" class="ta-spk ta-spi" data-say="'+esc(say)+'" aria-label="Nghe">🔊</button>'}
function parseReply(text){
  var lines=String(text||'').replace(/\r/g,'').split('\n'),secs=[],cur={type:'intro',title:'',lines:[]},head=null;
  secs.push(cur);
  lines.forEach(function(l,i){
    var m=l.match(/^\s*(?:#{1,4}\s*)?\*\*\s*([^*\n]{2,60}?)\s*:?\s*\*\*\s*:?\s*(.*)$/);
    if(m){
      var key=m[1].toLowerCase().replace(/\s*:\s*$/,'');
      if(SEC[key]){cur={type:SEC[key],title:m[1],lines:[]};secs.push(cur);if(m[2].trim())cur.lines.push(m[2]);return}
      if(!head&&secs.length===1&&!secs[0].lines.some(function(x){return x.trim()})&&ZH_ANY.test(m[1])&&/\/[^\/]+\//.test(l)){head=l;return}   /* dòng tiêu đề từ vựng */
    }
    cur.lines.push(l);
  });
  return {head:head,secs:secs};
}
function bullets(lines){   /* gom thành các mục: mỗi dòng "- ..." / "1. ..." là một mục, dòng khác nối vào mục trước */
  var out=[];
  lines.forEach(function(l){
    if(!l.trim())return;
    var m=l.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/);
    if(m)out.push({b:true,t:m[1]});
    else if(out.length&&/^\s{2,}\S/.test(l))out[out.length-1].t+=' '+l.trim();
    else out.push({b:false,t:l.trim()});
  });
  return out;
}
function splitExample(t){   /* "中文句 /pinyin/ — nghĩa" hoặc "中文句 (pinyin) — nghĩa" */
  var m=t.match(/^(.*?)\s*\/([^\/]+)\/\s*(?:[—–-]+|:)?\s*(.*)$/);
  if(m&&ZH_ANY.test(m[1]))return {zh:m[1].replace(/\*\*/g,'').trim(),py:m[2].trim(),vi:m[3].trim()};
  m=t.match(/^(.*?)\s*[（(]([^()（）]*[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ][^()（）]*)[)）]\s*(?:[—–-]+|:)?\s*(.*)$/);
  if(m&&ZH_ANY.test(m[1]))return {zh:m[1].replace(/\*\*/g,'').trim(),py:m[2].trim(),vi:m[3].trim()};
  m=t.match(/^(.*?[㐀-鿿][^—–]*?)\s*[—–]\s*(.*)$/);
  if(m&&ZH_ANY.test(m[1]))return {zh:m[1].replace(/\*\*/g,'').trim(),py:'',vi:m[2].trim()};
  return null;
}
function exCard(x){
  return '<div class="ta-ex"><div class="ta-ex-t"><div class="ta-ex-zh">'+zhSpan(esc(x.zh))+'</div>'+(x.py?'<div class="ta-ex-py">/'+esc(x.py.replace(/^\/|\/$/g,''))+'/</div>':'')+(x.vi?'<div class="ta-ex-vi">'+inl(x.vi)+'</div>':'')+'</div>'+spkBtn(x.zh.replace(new RegExp('[^'+ZH+']','g'),''))+'</div>';
}
function structHtml(lines){
  var txt=lines.filter(function(l){return l.trim()}).map(function(l){return l.trim()});if(!txt.length)return '';
  var formula=txt[0].replace(/^\s*(?:[-•*]\s+)/,''),rest=txt.slice(1),h='';
  var parts=formula.split(/\s+\+\s+/).map(function(x){return x.replace(/\*\*/g,'').trim()}).filter(Boolean);
  if(parts.length>=2||/^[\[\(（]?[㐀-鿿]/.test(formula)&&formula.length<60){
    h+='<div class="ta-fm">'+parts.map(function(p,i){
      var opt=/^[\[(（]|[…\]]$|^[\[（(].*[\]）)]$/.test(p)||/\[|…|\.{3}/.test(p)&&!/^[㐀-鿿]+$/.test(p);
      return (i?'<span class="ta-plus">+</span>':'')+'<span class="ta-chip'+(opt?' opt':'')+'">'+(ZH_ANY.test(p)&&!/^[\[(（]/.test(p)?zhSpan(esc(p)):esc(p))+'</span>';
    }).join('')+'</div>';
  }else rest=txt;
  if(rest.length)h+='<div class="ta-small">'+rest.map(inl).join('<br>')+'</div>';
  return h;
}
function listHtml(lines){
  var items=bullets(lines);if(!items.length)return '';
  var allB=items.every(function(x){return x.b});
  if(allB)return '<ul>'+items.map(function(x){return '<li>'+inl(x.t)+'</li>'}).join('')+'</ul>';
  return items.map(function(x){return x.b?'<ul><li>'+inl(x.t)+'</li></ul>':'<p>'+inl(x.t)+'</p>'}).join('');
}
function richHtml(text){
  var P=parseReply(text),got=P.secs.filter(function(s){return s.type!=='intro'}).length;
  if(!got&&!P.head)return null;
  var h='<div class="ta-rich"><div class="ta-who"><img src="tro-ly-avatar.jpg" alt=""><b>Lona</b></div>';
  if(P.head){
    var hm=P.head.match(/\*\*\s*([^*]+?)\s*\*\*\s*(\/[^\/]+\/)?\s*(.*)$/),zh=hm?hm[1]:'',py=hm&&hm[2]?hm[2]:'',tail=hm?hm[3]:'';
    var badges=tail.split(/[·•|]/).map(function(x){return x.replace(/^[\s,]+|[\s,]+$/g,'')}).filter(Boolean);
    var pm=py?'':(tail.match(/\/[^\/]+\//)||[''])[0];if(pm){py=pm;badges=badges.map(function(x){return x.replace(pm,'').trim()}).filter(Boolean)}
    h+='<div class="ta-hd"><div class="ta-hd-t"><span class="ta-hd-zh">'+zhSpan(esc(zh))+'</span>'+(py?'<span class="ta-hd-py">'+esc(py)+'</span>':'')+'</div>'+spkBtn(zh.replace(new RegExp('[^'+ZH+']','g'),''))+'</div>'+(badges.length?'<div class="ta-badges">'+badges.map(function(b){return '<span>'+inl(b)+'</span>'}).join('')+'</div>':'');
  }
  P.secs.forEach(function(s){
    var body=s.lines.join('\n').trim();
    if(s.type==='intro'){if(body)h+='<p class="ta-p">'+inl(body).replace(/\n/g,'<br>')+'</p>';return}
    if(!body&&s.type!=='follow')return;
    if(s.type==='follow'){
      var qs=s.lines.join(' ').split(/\s*\|\s*|\s*(?:^|\s)[-•]\s+/).map(function(x){return x.replace(/^[\s\-•*"“]+|[\s"”]+$/g,'')}).filter(function(x){return x.length>1});
      if(!qs.length)qs=bullets(s.lines).map(function(x){return x.t.replace(/\*\*/g,'')});
      if(qs.length)h+='<div class="ta-fu"><span>HỎI TIẾP</span>'+qs.slice(0,4).map(function(q){return '<button type="button" data-q="'+esc(q)+'">'+esc(q)+'</button>'}).join('')+'</div>';
      return;
    }
    var inner='';
    if(s.type==='struct')inner=structHtml(s.lines);
    else if(s.type==='ex'){
      var its=bullets(s.lines),cards='',extra='';
      its.forEach(function(x){var e=splitExample(x.t);if(e)cards+=exCard(e);else extra+='<p>'+inl(x.t)+'</p>'});
      inner=cards+(extra?'<div class="ta-small">'+extra+'</div>':'');
    }else inner=listHtml(s.lines);
    h+='<section class="ta-sec s-'+s.type+'"><h5>'+esc(SEC_T[s.type]||s.title)+'</h5>'+inner+'</section>';
  });
  return h+'</div>';
}
var RICH_CSS='.ta-m.a.rich{padding:0;background:transparent;border:0;box-shadow:none;max-width:100%;white-space:normal;align-self:stretch}'
+'.ta-rich{display:flex;flex-direction:column;gap:10px;background:var(--surface,#fff);border:1px solid var(--border-soft,rgba(0,0,0,.08));border-radius:20px 20px 20px 6px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.06)}'
+'.ta-who{display:flex;align-items:center;gap:8px;font-size:14px}.ta-who img{width:30px;height:30px;border-radius:50%;object-fit:cover}.ta-who b{font-weight:800}'
+'.ta-rich .ta-p{margin:0;font-size:14.5px;line-height:1.55}'
+'.ta-hd{display:flex;align-items:center;justify-content:space-between;gap:10px}.ta-hd-t{display:flex;flex-direction:column;gap:2px;min-width:0}'
+'.ta-hd-zh{font-family:var(--han-font,"Noto Serif TC",serif);font-size:28px;font-weight:700;line-height:1.2}.ta-hd-py{color:var(--ta-green,#0f7a4d);font-weight:600;font-size:15px}'
+'.ta-badges{display:flex;flex-wrap:wrap;gap:6px}.ta-badges span{background:var(--surface-2,#f2f2f5);border:1px solid var(--border-soft,rgba(0,0,0,.08));border-radius:999px;padding:2px 10px;font-size:12px;font-weight:600;color:var(--text-secondary,#555)}'
+'.ta-sec{border-radius:16px;padding:12px 14px;background:var(--surface-2,#f5f5f7);border:1px solid var(--border-soft,rgba(0,0,0,.06))}'
+'.ta-sec h5{margin:0 0 8px;font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--blue,#0071e3)}'
+'.ta-sec.s-struct{background:var(--blue-tint,#e1ecff);border-color:transparent}'
+'.ta-sec.s-note{background:#fff4d6;border-color:transparent;color:#3a2e0b}.ta-sec.s-note h5{color:#7a5a00}'
+'.ta-sec.s-ex{background:transparent;border:0;padding:0}.ta-sec.s-ex h5{padding:0 2px}'
+'.ta-fm{display:flex;flex-wrap:wrap;align-items:center;gap:6px}.ta-plus{font-weight:700;color:var(--blue,#0071e3)}'
+'.ta-chip{background:var(--surface,#fff);border-radius:12px;padding:8px 12px;font-weight:700;font-size:17px;box-shadow:0 1px 2px rgba(0,0,0,.08);font-family:var(--han-font,"Noto Serif TC",serif)}'
+'.ta-chip.opt{background:transparent;border:1.5px dashed var(--blue,#0071e3);color:var(--blue,#0071e3);box-shadow:none;font-family:inherit;font-size:15px}'
+'.ta-small{font-size:13.5px;line-height:1.5;margin-top:8px;color:var(--text-secondary,#555)}.ta-small p{margin:0 0 4px}'
+'.ta-ex{display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--surface,#fff);border:1px solid var(--border,rgba(0,0,0,.1));border-radius:16px;padding:12px 14px;margin-bottom:8px}'
+'.ta-ex-t{min-width:0}.ta-ex-zh{font-family:var(--han-font,"Noto Serif TC",serif);font-size:19px;font-weight:700;line-height:1.35}'
+'.ta-ex-py{color:var(--ta-green,#0f7a4d);font-weight:600;font-size:14px;margin-top:2px}.ta-ex-vi{color:var(--text-secondary,#666);font-size:14px;margin-top:2px}'
+'.ta-m.a .ta-spk{flex:none;width:38px!important;height:38px!important;border-radius:50%;border:1px solid var(--border,rgba(0,0,0,.12))!important;background:var(--surface,#fff)!important;color:var(--blue,#0071e3)!important;margin:0!important;font-size:15px!important;box-shadow:none!important;cursor:pointer}'
+'.ta-sec ul{margin:0;padding-left:18px}.ta-sec li{margin:0 0 6px;line-height:1.55;font-size:14.5px}.ta-sec li:last-child{margin-bottom:0}.ta-sec p{margin:0 0 6px;font-size:14.5px;line-height:1.55}'
+'.ta-rich .py{color:var(--ta-green,#0f7a4d);font-weight:600}'
+'.ta-m.a .ta-rich .zh{font-family:var(--han-font,"Noto Serif TC",serif);font-weight:700;font-size:1em;color:var(--ta-green,#0f7a4d);cursor:pointer;background:none;border-radius:0;padding:0;border-bottom:1px dotted currentColor}'
+'.ta-m.a .ta-rich .ta-ex-zh .zh,.ta-m.a .ta-rich .ta-hd-zh .zh,.ta-m.a .ta-rich .ta-chip .zh,.ta-m.a .ta-rich .ta-badges .zh{color:inherit;border-bottom:0}.ta-m.a .ta-rich .ta-chip.opt .zh{color:inherit}'
+'.ta-sec b{font-weight:800}.ta-sec.s-note b{color:#0c5a3b}'
+'.ta-fu{display:flex;flex-wrap:wrap;align-items:center;gap:6px}.ta-fu span{font-size:11.5px;font-weight:800;letter-spacing:.08em;color:var(--blue,#0071e3);margin-right:2px}'
+'.ta-fu button{border:1px solid var(--border,rgba(0,0,0,.14));background:var(--surface,#fff);color:inherit;border-radius:999px;padding:6px 12px;font:600 13px/1.3 inherit;font-family:inherit;cursor:pointer;text-align:left}.ta-fu button:hover{background:var(--blue-tint,rgba(0,113,227,.08))}'
+':root{--ta-green:#0f7a4d}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--ta-green:#5fd3a0}:root:not([data-theme="light"]) .ta-sec.s-note{background:#3a3115;color:#f5e9c0}:root:not([data-theme="light"]) .ta-sec.s-note h5{color:#f0c75a}:root:not([data-theme="light"]) .ta-sec.s-note b{color:#8ee0b8}:root:not([data-theme="light"]) .ta-sec.s-struct{background:rgba(10,132,255,.18)}}'
+'html[data-theme="dark"]{--ta-green:#5fd3a0}html[data-theme="dark"] .ta-sec.s-note{background:#3a3115;color:#f5e9c0}html[data-theme="dark"] .ta-sec.s-note h5{color:#f0c75a}html[data-theme="dark"] .ta-sec.s-note b{color:#8ee0b8}html[data-theme="dark"] .ta-sec.s-struct{background:rgba(10,132,255,.18)}';
(function(){var st=document.createElement('style');st.textContent=RICH_CSS;document.head.appendChild(st)})();
function fmt(t){var r=null;try{r=richHtml(t)}catch(e){r=null}return r!==null?r:fmtPlain(t)}
function fmtPlain(t){
  var h=esc(t).replace(/\*\*([^*\n]+)\*\*/g,'<b>$1</b>').replace(/^- /gm,'• ');
  /* mỗi cụm/câu tiếng Hoa: gạch chân chấm + loa nhỏ ngay bên cạnh để nghe */
  return h.replace(/([\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff][\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff，。！？：；「」『』…～]*)/g,function(m){
    var say=m.replace(/[，。！？：；「」『』…～]/g,'');if(!say)return m;
    return '<button type="button" class="ta-sp ta-spi" data-say="'+say+'" aria-label="Nghe">🔊</button><span class="zh" data-say="'+say+'">'+m+'</span>';
  });
}
function addMsg(role,text){
  var d=document.createElement('div');d.className='ta-m '+(role==='user'?'u':'a');
  if(role==='user')d.textContent=text;else{d.innerHTML=fmt(text);if(d.querySelector('.ta-rich'))d.classList.add('rich')}
  msgsEl.appendChild(d);msgsEl.scrollTop=msgsEl.scrollHeight;return d;
}
function renderConvo(){
  msgsEl.innerHTML='';
  if(!convo.length)addMsg('assistant','Xin chào! Mình là trợ lý ảo Lona của Thịnh & Loan 💕 Bạn cứ hỏi về từ vựng, ngữ pháp hay nhờ dịch/sửa câu tiếng Hoa nhé.');
  convo.forEach(function(m){addMsg(m.role,m.content)});
  sugEl.style.display=convo.length?'none':'';
}
msgsEl.addEventListener('click',function(e){
  var q=e.target.closest&&e.target.closest('.ta-fu button');if(q&&!busy){cta.value=q.dataset.q;sendChat();return}
  var z=e.target.closest&&e.target.closest('.zh,.ta-spi');if(z)speak(z.dataset.say,z)});
sugEl.innerHTML=SUG.map(function(x){return '<button type="button">'+esc(x)+'</button>'}).join('');
sugEl.querySelectorAll('button').forEach(function(b){b.onclick=function(){cta.value=b.textContent;sendChat()}});
function cauto(){cta.style.height='auto';cta.style.height=Math.min(120,cta.scrollHeight)+'px'}
cta.addEventListener('input',cauto);
cta.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();sendChat()}});
cgo.addEventListener('click',sendChat);
function sendChat(){
  var t=cta.value.trim().slice(0,1000);if(!t||busy)return;
  cta.value='';cauto();sugEl.style.display='none';
  convo.push({role:'user',content:t});addMsg('user',t);
  if(!API){addMsg('assistant','Mình chưa được nối với máy chủ AI nên chưa trò chuyện tự nhiên được 🥲 Bạn xem hướng dẫn trong thư mục worker/README.md để bật nhé.');convo.pop();return}
  busy=true;cgo.disabled=true;
  var typing=addMsg('assistant','…');
  apiChat(convo.slice(-12)).then(function(r){
    var fh=fmt(r.text);typing.classList.toggle('rich',fh.indexOf('ta-rich')>=0);typing.innerHTML=fh+srcHtml(r.sources)+(r.status&&r.status!=='ok'?'<div class="ta-src">⚠️ Tra web: '+esc(r.status)+'</div>':'');convo.push({role:'assistant',content:r.text});convo=convo.slice(-20);store('ta_chat',convo);
  }).catch(function(e){
    convo.pop();
    typing.textContent=e&&e.code==='limit'?'Hôm nay bạn đã dùng hết lượt hỏi rồi, mai quay lại nhé!':'Mình chưa trả lời được lúc này, bạn gửi lại giúp mình nhé.';
  }).then(function(){busy=false;cgo.disabled=false;msgsEl.scrollTop=msgsEl.scrollHeight});
}
/* Lấy dữ liệu đã kiểm chứng từ kho TOCFL của trang để AI trả lời đúng, không bịa */
/* Nhận ý định hỏi nhanh: "chào buổi sáng là gì" → muốn chữ Hán; "早安是什麼" / "早安 là gì" → muốn nghĩa tiếng Việt */
var ZH_CH='\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff';
var ZH_RE=new RegExp('['+ZH_CH+']'), ZH_ALL=new RegExp('['+ZH_CH+']+','g');
function wre(list,flags){list=list.slice().sort(function(a,b){return b.length-a.length});return new RegExp('(?<![\\p{L}\\p{N}])(?:'+list.join('|')+')(?![\\p{L}\\p{N}])',flags||'iu')}
var ZHQ_RE=wre(['là gì','nghĩa là gì','có nghĩa là gì','nghĩa gì','nghĩa là sao','là sao','nghĩa của','đọc là gì','đọc thế nào','giải nghĩa','là j','là gi','nghia la gi']);
var ZHQ_ZH=/(是?什麼意思|是?什么意思|是什麼|是什么|意思是|怎麼說|怎么说)/;
var VIQ_RE=wre(['là gì','nghĩa là gì','là j','nói thế nào','nói sao','nói như thế nào','viết thế nào','viết sao','viết như thế nào','viết chữ','chữ hán','chữ trung','chữ hoa','tiếng trung','tiếng hoa','tiếng đài','tiếng quan thoại','tiếng hán','dịch sang','dịch ra','trong tiếng','bằng tiếng']);
var NOINT_RE=wre(['ngữ pháp','cấu trúc','cách dùng','khác nhau','phân biệt','so sánh','giải thích câu','sửa câu','sai ở đâu']);
var FILL1=wre(['cho mình hỏi','cho tôi hỏi','cho hỏi','mình hỏi','tôi hỏi','hỏi','cho mình biết','bạn ơi','lona ơi','ơi','nhé','nha','nhỉ','vậy','ạ','với','giúp mình','giúp'],'giu');
var LANGS=['tiếng đài loan','tiếng quan thoại','tiếng trung','tiếng hoa','tiếng đài','tiếng hán','chữ hán','chữ trung','chữ hoa','chữ phồn thể','phồn thể'],LPRE=['','bằng ','trong ','dịch sang ','dịch ra ','nói bằng ','viết bằng ','viết chữ ','viết '],LCOMBO=[];
LPRE.forEach(function(p){LANGS.forEach(function(l){LCOMBO.push(p+l)})});
var FILL2=wre(LCOMBO.concat(['nghĩa là gì','có nghĩa là gì','là gì','là j','nói thế nào','nói sao','nói như thế nào','viết thế nào','viết sao','viết như thế nào','viết chữ','viết','dịch sang','dịch ra','dịch','chữ hán','chữ trung','chữ hoa','trong tiếng','bằng tiếng','tiếng trung','tiếng hoa','tiếng đài','tiếng quan thoại','tiếng hán','thế nào','như thế nào','từ','cụm từ','câu']),'giu');
function detectIntent(text){
  text=String(text||'').trim();if(!text||NOINT_RE.test(text))return null;
  if(ZH_RE.test(text)){
    if(!ZHQ_RE.test(text)&&!ZHQ_ZH.test(text))return null;
    var vi=text.replace(ZH_ALL,' ').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
    var zh=(text.replace(ZHQ_ZH,' ').match(ZH_ALL)||[]).join('');
    if(!zh||zh.length>12||vi.split(' ').length>8)return null;     /* câu dài → để Lona xử lý bình thường */
    return {dir:'zh2vi',phrase:zh};
  }
  if(!VIQ_RE.test(text))return null;
  var p=text.replace(/[?？!！。.,:;]/g,' ').replace(FILL1,' ').replace(FILL2,' ').replace(/\s+/g,' ').trim();
  if(p.length<2||p.length>40)return null;
  if(!/[^\x00-\x7f]/.test(p))return null;      /* toàn ký tự không dấu (có thể là pinyin hoặc gõ thiếu dấu) → để Lona tự suy luận */
  return {dir:'vi2zh',phrase:p};
}
function buildContext(text){
  var seen={},rows=[],intent=detectIntent(text);
  function add(w){
    if(!w||rows.length>=8)return;var k=w.han+'|'+w.nghia;if(seen[k])return;seen[k]=1;
    var ex=(w.examples&&w.examples[0])||null;
    rows.push(w.han+' | '+(w.pinyin||'')+' | '+String(w.nghia||'').slice(0,140)+' | '+(w.tocfl||'')+(ex?' | ví dụ: '+ex.han+' — '+(ex.vi||''):''));
  }
  try{
    (text.match(/[㐀-䶿一-鿿豈-﫿]+/g)||[]).forEach(function(chunk){
      segment(chunk).forEach(function(x){if(x.w)lookupHan(x.t).slice(0,2).forEach(add)});
      if(chunk.length>1)lookupHan(chunk).slice(0,2).forEach(add);
    });
    var vi=text.replace(/[㐀-䶿一-鿿豈-﫿]+/g,' ').trim();
    if(intent&&intent.dir==='vi2zh')searchVi(intent.phrase,6).forEach(add);
    else if(vi.length>=2&&vi.length<=40)searchVi(vi,4).forEach(add);
  }catch(e){}
  var hint='';
  if(intent&&intent.dir==='vi2zh')hint='[Ý ĐỊNH] Người dùng đang hỏi CHỮ HÁN của cụm tiếng Việt «'+intent.phrase+'». Hãy trả lời NGAY ở dòng đầu bằng chữ Hán PHỒN THỂ (Đài Loan) kèm pinyin, rồi tối đa 1–2 cách nói khác (nếu có, nêu sắc thái), 1 ví dụ ngắn. Không giảng dài dòng.\n';
  else if(intent&&intent.dir==='zh2vi')hint='[Ý ĐỊNH] Người dùng đang hỏi NGHĨA TIẾNG VIỆT của «'+intent.phrase+'». Hãy trả lời NGAY ở dòng đầu bằng nghĩa tiếng Việt (kèm pinyin), rồi 1 ví dụ ngắn. Không giảng dài dòng.\n';
  return hint+rows.join('\n');
}
function srcHtml(src){
  if(!src||!src.length)return '';var seen={},out=[];
  src.forEach(function(x){if(!x||!x.url||!/^https:\/\//.test(x.url)||seen[x.name])return;seen[x.name]=1;out.push('<a href="'+esc(x.url)+'" target="_blank" rel="noopener">'+esc(x.name)+'</a>')});
  return out.length?'<div class="ta-src">🔎 Nguồn tra cứu: '+out.join(' · ')+'</div>':'';
}
function apiChat(messages){
  var lastUser='';for(var i=messages.length-1;i>=0;i--){if(messages[i].role==='user'){lastUser=messages[i].content;break}}
  return fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task:'chat',messages:messages,context:buildContext(lastUser)})})
   .then(function(r){return r.json().catch(function(){return {ok:false,error:'http_'+r.status}})})
   .then(function(j){if(!j||!j.ok||!j.data||!j.data.reply){var e=new Error('chat');e.code=j&&j.error;throw e}return {text:String(j.data.reply),sources:j.data.sources||[],status:j.data.status||''}});
}
function showView(v){
  dictEl.hidden=v!=='dict';chatEl.hidden=v!=='chat';
  setClrTitle();
  if(v==='chat'){renderConvo();setTimeout(function(){try{cta.focus()}catch(e){}},60)}
}
var clr=document.createElement('button');clr.type='button';clr.className='ta-x';clr.title='Xóa cuộc trò chuyện';clr.setAttribute('aria-label','Xóa cuộc trò chuyện');clr.textContent='🗑';clr.style.cssText='margin-left:auto;margin-right:6px;font-size:14px';
var xb=$('.ta-h .ta-x',panel);xb.style.marginLeft='0';xb.parentNode.insertBefore(clr,xb);
clr.onclick=function(){
  convo=[];store('ta_chat',[]);renderConvo()
};
function setClrTitle(){var t='Xóa cuộc trò chuyện';clr.title=t;clr.setAttribute('aria-label',t)}
setClrTitle();
showView('chat');
window.taOpen=function(q){toggle(true);if(q){cta.value=q;sendChat()}};
})();
