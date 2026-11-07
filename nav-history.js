/* Nút Quay lại / Đi tiếp giữa các chức năng — © 2026 Học TOCFL cùng Thịnh & Loan
   Mỗi lần chuyển chức năng (tab) được ghi vào lịch sử trình duyệt, nên các nút ← → trên thanh trên cùng,
   nút Quay lại / Tiến của chuột (nút bên hông), phím Alt+← / Alt+→ và cử chỉ vuốt quay lại trên điện thoại đều dùng được. */
(function(){
'use strict';
if(!window.history||!history.pushState)return;
var idx=0,max=0,fromPop=false,silent=0,popping=false,lastSwitch=0;
function panelTab(){var p=document.querySelector('.panel.active');return p&&p.id?p.id.replace(/^panel-/,''):'home'}   /* theo khung đang hiện (game như Hangman chạy trong khung riêng nhưng nút tab ở thanh bên vẫn là "Game đặc biệt") */
var cur=panelTab(),curSub=0;
try{history.replaceState({tab:cur,sub:0,i:0,tfl:1},'')}catch(e){return}
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

/* Bộ chọn chế độ (Quiz, Nghe viết, Game đặc biệt…): vào một chế độ = thêm một bước lịch sử, quay lại sẽ về bộ chọn */
var EXIT_SEL='[id$="-exit"],#dc-back,#vr-back,#vl-back1,.dc-back,.vl-back';
function visible(el){return !!el&&!el.hidden&&el.offsetParent!==null}
function panelExit(panel){
  var list=panel.querySelectorAll(EXIT_SEL);
  for(var i=0;i<list.length;i++){if(visible(list[i])){list[i].click();return true}}
  return false;
}
function pickerShown(panel){var m=panel.querySelector('#vl-pick,[id$="-modal"]:not(#sc-modal)');return !m||visible(m)}
function push(sub){
  idx++;max=idx;curSub=sub;
  try{history.pushState({tab:cur,sub:sub,i:idx,tfl:1},'')}catch(err){}
  upd();
}
/* Ghi lịch sử mỗi khi đổi chức năng */
document.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('.tab-btn');if(!t||fromPop)return;
  lastSwitch=Date.now();
  setTimeout(function(){
    var now=panelTab();                                   /* chức năng bị khóa Pro sẽ không đổi khung → không ghi */
    if(now===cur)return;
    cur=now;push(0);
  },0);
},false);

/* Theo dõi bộ chọn chế độ của từng chức năng */
function watchModals(){
  ['vl-pick','ls-modal','ty-modal','rx-modal','mt-modal','qg-modal','sp-modal'].forEach(function(k){
    var m=document.getElementById(k);if(!m)return;
    new MutationObserver(function(){
      var p=m.closest('.panel');   /* bộ chọn được chuyển vào khung chức năng sau khi trang dựng xong nên tìm lại mỗi lần */
      if(popping||!p||Date.now()-lastSwitch<400||p!==document.querySelector('.panel.active')||p.id!=='panel-'+cur)return;   /* bộ chọn tự ẩn/hiện khi vừa đổi tab thì bỏ qua */
      var shown=visible(m);
      if(!shown&&curSub===0)push(1);                      /* vừa chọn chế độ → vào game */
      else if(shown&&curSub===1){silent++;curSub=0;history.back()}   /* tự thoát bằng nút trong trang → bỏ bước lịch sử thừa */
    }).observe(m,{attributes:true,attributeFilter:['hidden','class','style']});
  });
}
watchModals();

window.addEventListener('popstate',function(e){
  var s=e.state;if(!s||!s.tfl)return;
  var back=(s.i||0)<idx;idx=s.i||0;if(idx>max)max=idx;lastSwitch=Date.now();
  if(silent>0){silent--;curSub=s.sub||0;cur=s.tab||cur;upd();return}
  popping=true;
  try{
    if(s.tab&&s.tab!==cur){
      var b=document.querySelector('.tab-btn[data-tab="'+s.tab+'"]');
      if(b){fromPop=true;try{b.click()}finally{fromPop=false}}
      cur=panelTab();curSub=0;
    }
    var pn=document.getElementById('panel-'+cur);
    if((s.sub||0)===0&&curSub===1&&pn){panelExit(pn)}      /* lùi ra khỏi game → về bộ chọn chế độ */
    curSub=0;
    if((s.sub||0)===1&&pn&&pickerShown(pn)){                /* bước "đang chơi" không khôi phục được → bỏ qua */
      if(back&&idx>0){popping=false;history.back();return}
      if(!back&&idx<max){popping=false;history.forward();return}
      try{history.replaceState({tab:cur,sub:0,i:idx,tfl:1},'')}catch(err){}
    }else if((s.sub||0)===1)curSub=1;
  }finally{popping=false}
  upd();
});
upd();
})();
