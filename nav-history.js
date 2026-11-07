/* Nút Quay lại / Đi tiếp giữa các chức năng — © 2026 Học TOCFL cùng Thịnh & Loan
   Mỗi lần chuyển chức năng (tab) được ghi vào lịch sử trình duyệt, nên các nút ← → trên thanh trên cùng,
   nút Quay lại / Tiến của chuột (nút bên hông), phím Alt+← / Alt+→ và cử chỉ vuốt quay lại trên điện thoại đều dùng được. */
(function(){
'use strict';
if(!window.history||!history.pushState)return;
var idx=0,max=0,fromPop=false;
var cur=(document.querySelector('.tab-btn.active')||{dataset:{}}).dataset.tab||'home';
try{history.replaceState({tab:cur,i:0,tfl:1},'')}catch(e){return}

var ARROW={
  back:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>',
  fwd:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>'
};
var st=document.createElement('style');
st.textContent='.nav-hist{order:-2;display:inline-flex;gap:6px;flex:none;align-items:center}'
 +'.nav-hist button{appearance:none;width:34px;height:34px;padding:0;border-radius:50%;border:1px solid var(--border);background:var(--surface-2,var(--surface));color:var(--text);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s,opacity .15s,border-color .15s}'
 +'.nav-hist button:hover:not(:disabled){background:var(--surface);border-color:var(--u-jade,var(--blue))}'
 +'.nav-hist button:active:not(:disabled){transform:scale(.94)}'
 +'.nav-hist button:disabled{opacity:.35;cursor:default}'
 +'@media (max-width:640px){.nav-hist{gap:4px}.nav-hist button{width:32px;height:32px}}';
document.head.appendChild(st);

function mk(){
  var d=document.createElement('div');d.className='nav-hist';
  d.innerHTML='<button type="button" class="nh-back" aria-label="Quay lại" title="Quay lại (Alt + ←)">'+ARROW.back+'</button><button type="button" class="nh-fwd" aria-label="Đi tiếp" title="Đi tiếp (Alt + →)">'+ARROW.fwd+'</button>';
  return d;
}
function upd(){
  document.querySelectorAll('.nh-back').forEach(function(b){b.disabled=idx<=0});
  document.querySelectorAll('.nh-fwd').forEach(function(b){b.disabled=idx>=max});
}
document.querySelectorAll('.panel .toolbar').forEach(function(tb){tb.insertBefore(mk(),tb.firstChild)});
document.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('.nav-hist button');if(!b)return;
  if(b.disabled)return;
  if(b.classList.contains('nh-back'))history.back();else history.forward();
});

/* Ghi lịch sử mỗi khi đổi chức năng */
document.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('.tab-btn');if(!t||fromPop)return;
  var tab=t.dataset.tab;
  setTimeout(function(){
    var a=document.querySelector('.tab-btn.active'),now=a&&a.dataset.tab;   /* chức năng bị khóa Pro sẽ không đổi tab → không ghi */
    if(!now||now===cur)return;
    cur=now;idx++;max=idx;
    try{history.pushState({tab:now,i:idx,tfl:1},'')}catch(err){}
    upd();
  },0);
},false);

window.addEventListener('popstate',function(e){
  var s=e.state;if(!s||!s.tfl)return;
  idx=s.i||0;if(idx>max)max=idx;
  if(s.tab&&s.tab!==cur){
    var b=document.querySelector('.tab-btn[data-tab="'+s.tab+'"]');
    if(b){fromPop=true;try{b.click()}finally{fromPop=false}}
  }
  cur=s.tab||cur;upd();
});
upd();
})();
