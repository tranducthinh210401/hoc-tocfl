/* Trợ lý từ điển Hán (phồn thể) ⇄ Việt — © 2026 Học TOCFL cùng Thịnh & Loan
   Nguồn tra cứu: (1) kho từ vựng TOCFL trong trang (chính xác nhất, có ví dụ),
   (2) Google Translate (gtx) ra zh-TW + pinyin, (3) MyMemory dự phòng. */
(function(){
'use strict';
var IMG='tro-ly-avatar.jpg';
/* Địa chỉ máy chủ trung gian (xem worker/README.md). Để trống = dùng dịch miễn phí, chưa có giải thích ngữ pháp bằng AI. */
var API=(window.TRO_LY_API||'').replace(/\/$/,'');
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
.ta-fab.hasnew{animation:ta-bob 2.4s ease-in-out infinite}\
@keyframes ta-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}\
.ta-tip{position:fixed;z-index:9000;background:var(--surface,#fff);color:var(--text,#1d1d1f);border:1px solid var(--border,rgba(0,0,0,.1));border-radius:14px 14px 4px 14px;padding:8px 12px;font:600 13px "Be Vietnam Pro",system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.16);max-width:200px;animation:ta-in .3s}\
@keyframes ta-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}\
.ta-panel{position:fixed;right:12px;bottom:12px;width:min(400px,calc(100vw - 24px));max-height:min(640px,calc(100dvh - 24px));display:none;flex-direction:column;background:var(--surface,#fff);color:var(--text,#1d1d1f);border:1px solid var(--border,rgba(0,0,0,.1));border-radius:22px;box-shadow:0 18px 50px rgba(0,0,0,.28);z-index:9001;overflow:hidden;font-family:"Be Vietnam Pro",system-ui,sans-serif}\
.ta-panel.open{display:flex;animation:ta-in .22s}\
.ta-h{display:flex;align-items:center;gap:10px;padding:12px 14px;background:linear-gradient(100deg,#fff4d6,#e3f0ff);color:#1d1d1f;flex:none}\
.ta-h img{width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid #fff;flex:none}\
.ta-h b{display:block;font-size:15px;line-height:1.2}.ta-h small{display:block;font-size:11.5px;opacity:.7;margin-top:1px}\
.ta-x{margin-left:auto;border:0;background:rgba(0,0,0,.08);width:32px;height:32px;border-radius:50%;font-size:18px;line-height:1;cursor:pointer;color:inherit;flex:none}\
.ta-body{overflow:auto;padding:12px 14px;flex:1;min-height:120px;-webkit-overflow-scrolling:touch}\
.ta-modes{display:flex;gap:6px;margin-bottom:10px}\
.ta-modes button{flex:1;border:1.5px solid var(--border,rgba(0,0,0,.12));background:transparent;color:inherit;border-radius:999px;padding:7px 6px;font:600 12.5px inherit;font-family:inherit;cursor:pointer}\
.ta-modes button.on{background:var(--blue,#0071e3);border-color:var(--blue,#0071e3);color:#fff}\
.ta-in{display:flex;gap:8px;align-items:flex-end}\
.ta-in textarea{flex:1;resize:none;border:1.5px solid var(--border,rgba(0,0,0,.14));border-radius:14px;padding:10px 12px;font:500 16px/1.4 "Be Vietnam Pro","Noto Serif TC",system-ui,sans-serif;background:var(--surface-2,#fafafa);color:inherit;min-height:46px;max-height:120px;outline:none}\
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
.ta-err{color:#c2410c;font-size:13.5px;margin-top:10px}\
.ta-foot{flex:none;text-align:center;font-size:11px;color:var(--text-tertiary,#86868b);padding:6px 10px 9px;border-top:1px solid var(--border-soft,rgba(0,0,0,.07))}\
.ta-dots{display:inline-block}.ta-dots::after{content:"…";animation:ta-bob 1s infinite}\
@media (max-width:700px){.ta-panel{right:8px;left:8px;width:auto;bottom:8px;max-height:calc(100dvh - 16px)}}\
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .ta-h{background:linear-gradient(100deg,#3a3320,#1f2f46);color:#f5f5f7}}\
html[data-theme="dark"] .ta-h{background:linear-gradient(100deg,#3a3320,#1f2f46);color:#f5f5f7}\
html[data-theme="dark"] .ta-x{background:rgba(255,255,255,.14)}';
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
function speak(txt){
  try{if(aud){aud.pause();aud=null}}catch(e){}
  var u='https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=zh-TW&q='+encodeURIComponent(txt);
  aud=new Audio(u);
  aud.play().catch(function(){
    try{var s=new SpeechSynthesisUtterance(txt);s.lang='zh-TW';speechSynthesis.cancel();speechSynthesis.speak(s)}catch(e){}
  });
}

/* ---------- Giao diện ---------- */
var fab=document.createElement('button');fab.className='ta-fab';fab.type='button';fab.title='Trợ lý từ điển Hán ⇄ Việt';fab.setAttribute('aria-label','Mở trợ lý từ điển');
document.body.appendChild(fab);
var panel=document.createElement('div');panel.className='ta-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Trợ lý từ điển');
panel.innerHTML='<div class="ta-h"><img src="'+IMG+'" alt=""><div><b>Trợ lý từ điển</b><small>Hán phồn thể ⇄ Tiếng Việt</small></div><button class="ta-x" type="button" aria-label="Đóng">×</button></div>'
 +'<div class="ta-body"><div class="ta-modes"><button type="button" data-m="auto" class="on">Tự nhận</button><button type="button" data-m="zh2vi">繁 → Việt</button><button type="button" data-m="vi2zh">Việt → 繁</button></div>'
 +'<div class="ta-in"><textarea rows="1" placeholder="Gõ hoặc dán chữ Hán / tiếng Việt…" enterkeyhint="search"></textarea><button class="ta-go" type="button">Dịch</button></div>'
 +'<div class="ta-out"></div><div class="ta-hist"></div></div>'
 +'<div class="ta-foot">© 2026 Học TOCFL cùng Thịnh &amp; Loan · Bản dịch tự động, hãy đối chiếu khi thi</div>';
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
  panel.classList.toggle('open',o);fab.style.display=o?'none':'';
  var t=$('.ta-tip');if(t)t.remove();
  if(o){renderHist();setTimeout(function(){try{ta.focus()}catch(e){}},60)}
}
$('.ta-x',panel).addEventListener('click',function(){toggle(false)});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&panel.classList.contains('open'))toggle(false)});
panel.querySelectorAll('.ta-modes button').forEach(function(b){b.addEventListener('click',function(){
  mode=b.dataset.m;panel.querySelectorAll('.ta-modes button').forEach(function(x){x.classList.toggle('on',x===b)});if(ta.value.trim())run();
})});
function autosize(){ta.style.height='auto';ta.style.height=Math.min(120,ta.scrollHeight)+'px'}
ta.addEventListener('input',autosize);
ta.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();run()}});
go.addEventListener('click',run);

function renderHist(){
  histEl.innerHTML=hist.length?hist.map(function(h,i){return '<button type="button" data-i="'+i+'">'+esc(h)+'</button>'}).join(''):'';
  histEl.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){ta.value=hist[+b.dataset.i];autosize();run()})});
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
  out.querySelectorAll('[data-say]').forEach(function(b){b.onclick=function(){speak(b.dataset.say)}});
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
  var dir=detect(q);
  go.disabled=true;
  var html='',local=[],extra=[];
  if(dir==='zh2vi'){local=lookupHan(q);if(!local.length&&q.length<=4)extra=containsHan(q,6)}
  else{local=searchVi(q,8)}
  out.innerHTML='<div class="ta-card"><h4>Đang dịch <span class="ta-dots"></span></h4></div>';
  var localHtml='';
  if(local.length||extra.length){
    localHtml='<div class="ta-card"><h4>'+(local.length?'Trong kho từ vựng TOCFL':'Từ chứa “'+esc(q)+'” trong kho TOCFL')+'</h4>'+(local.length?local:extra).map(entryHtml).join('')+'</div>';
  }
  var segHtml='';
  if(dir==='zh2vi'&&q.length>1){
    var sg=segment(q).filter(function(x){return CJK.test(x.t)});
    if(sg.length>1&&sg.some(function(x){return x.w})){
      segHtml='<div class="ta-card"><h4>Tách từng từ</h4><div class="ta-seg">'+segment(q).map(function(x){
        if(!CJK.test(x.t))return x.t.trim()?'<span><b>'+esc(x.t)+'</b></span>':'';
        return '<span data-q="'+esc(x.t)+'"><b>'+esc(x.t)+'</b>'+(x.w?'<small>'+esc(x.w.pinyin||'')+'</small><em>'+esc(shortMeaning(x.w))+'</em>':'')+'</span>'}).join('')+'</div></div>';
    }
  }
  var main=translate(q,dir,my.signal);
  var trad=null;
  if(dir==='zh2vi'&&/[一-鿿]/.test(q)&&!API){trad=gtx(q,'zh-CN','zh-TW',my.signal).then(function(r){return r.text&&r.text!==q?r.text:null}).catch(function(){return null})}
  Promise.all([main,trad]).then(function(res){
    if(my!==ctrl)return;
    var r=res[0],tr=res[1]||r.trad||null,h='';if(tr===q)tr=null;
    if(dir==='zh2vi'){
      h+='<div class="ta-card"><div class="ta-qline"><span class="ta-qh">'+esc(q)+'</span><button class="ta-sp" type="button" data-say="'+esc(q)+'" aria-label="Nghe từ vừa tra">🔊</button></div><h4>Nghĩa tiếng Việt</h4><div class="ta-row"><div><div class="ta-big">'+esc(r.text)+'</div>'
       +(r.translit?'<div class="ta-py">'+esc(r.translit)+'</div>':'')+(tr?'<div class="ta-note">Dạng phồn thể: <b style="font-family:var(--han-font,serif)">'+esc(tr)+'</b> '+'</div>':'')
       +'</div><div style="display:flex;gap:6px">'+speakBtn(tr||q)+copyBtn(r.text)+'</div></div>'
       +(r.alts.length?'<div class="ta-note">Nghĩa khác: '+r.alts.map(esc).join(' · ')+'</div>':'')+'</div>';
    }else{
      h+='<div class="ta-card"><h4>Chữ Hán phồn thể (Đài Loan)</h4><div class="ta-row"><div><div class="ta-big zh">'+esc(r.text)+'</div>'
       +(r.translit?'<div class="ta-py">'+esc(r.translit)+'</div>':'')
       +'</div><div style="display:flex;gap:6px">'+speakBtn(r.text)+copyBtn(r.text)+'</div></div>'
       +(r.alts.length?'<div class="ta-note">Cách nói khác: '+r.alts.map(function(a){return '<a href="#" data-q="'+esc(a)+'" style="color:inherit">'+esc(a)+'</a>'}).join(' · ')+'</div>':'')+'</div>';
    }
    if(r.note)h+='<div class="ta-note" style="margin:6px 4px 0">'+esc(r.note)+'</div>';
    var zh=dir==='zh2vi'?(tr||q):r.text;
    h+='<button class="ta-gram" type="button" data-zh="'+esc(zh)+'">📘 Giải thích ngữ pháp</button><div class="ta-gout"></div>';
    out.innerHTML=localHtml+h+segHtml+'<div class="ta-note" style="margin:8px 4px 0">'+(local.length?'Ưu tiên nghĩa trong kho TOCFL ở trên; ':'')+'bản dịch máy chỉ để tham khảo.</div>';
    bindOut();pushHist(q);
    var gb=$('.ta-gram',out);if(gb)gb.onclick=function(){grammar(gb.dataset.zh,gb)};
  }).catch(function(e){
    if(e&&e.name==='AbortError')return;
    if(my!==ctrl)return;
    out.innerHTML=localHtml+segHtml+'<div class="ta-err">'+(local.length?'Không kết nối được dịch trực tuyến — bạn vẫn có kết quả trong kho TOCFL ở trên.':'Chưa dịch được (cần Internet hoặc dịch vụ đang bận). Bạn thử lại sau giây lát nhé.')+'</div>';
    bindOut();
  }).then(function(){if(my===ctrl)go.disabled=false});
}

/* lời chào nhỏ lần đầu */
try{
  if(!store('ta_seen')){
    store('ta_seen',1);
    setTimeout(function(){
      if(panel.classList.contains('open'))return;
      var t=document.createElement('div');t.className='ta-tip';t.textContent='Xin chào! Cần tra từ Hán ⇄ Việt cứ hỏi mình nhé 💕';document.body.appendChild(t);
      var r=fab.getBoundingClientRect();t.style.right=Math.max(8,innerWidth-r.right)+'px';t.style.bottom=(innerHeight-r.top+10)+'px';
      setTimeout(function(){t.remove()},6000);
    },2500);
  }
}catch(e){}
window.taOpen=function(q){toggle(true);if(q){ta.value=q;autosize();run()}};
})();
