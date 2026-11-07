/* Quay lại / Đi tiếp giữa các chức năng — © 2026 Học TOCFL cùng Thịnh & Loan
   Mỗi lần chuyển chức năng (tab) hoặc vào một chế độ chơi được ghi vào lịch sử trình duyệt, nên nút ← → trên thanh địa chỉ,
   nút Quay lại / Tiến của chuột (nút bên hông), phím Alt+← / Alt+→ và cử chỉ vuốt quay lại trên điện thoại đều dùng được.
   (Không có nút riêng trong trang.) */
(function(){
'use strict';
if(!window.history||!history.pushState)return;
var idx=0,max=0,fromPop=false,silent=0,popping=false,lastSwitch=0;
function panelTab(){var p=document.querySelector('.panel.active');return p&&p.id?p.id.replace(/^panel-/,''):'home'}   /* theo khung đang hiện (game như Hangman chạy trong khung riêng nhưng nút tab ở thanh bên vẫn là "Game đặc biệt") */
var cur=panelTab(),curSub=0;
try{history.replaceState({tab:cur,sub:0,i:0,tfl:1},'')}catch(e){return}
function upd(){}

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
