/* Tài khoản & đồng bộ tiến độ (Firebase Auth + Firestore) — © 2026 Học TOCFL cùng Thịnh & Loan
   - Không đăng nhập vẫn dùng bình thường; đăng nhập chỉ để đồng bộ giữa các thiết bị.
   - Cấu hình nằm trong firebase-config.js. Chưa cấu hình thì nút đăng nhập bị ẩn. */
(function(){
'use strict';
var CFG=window.FIREBASE_CONFIG;
if(!CFG||!CFG.apiKey)return;
var FB='https://www.gstatic.com/firebasejs/10.14.1/';
var ZALO='0939509695';

/* Các khóa localStorage được đồng bộ */
function synced(k){return /^(tv_flashcard_v1|tv_talk_v1|tv_dict_v1|wrCfg|ta_chat|ta_hist|hg-hide3|hg-mus|acc_study|[a-z]{2}-best)$/.test(k)}
var BEST=/-best$/;
var TKEY='tk_t';             /* mốc thời gian sửa cục bộ từng khóa */
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
var rawSet=Storage.prototype.setItem,rawRemove=Storage.prototype.removeItem;
function lsSet(k,v){try{rawSet.call(localStorage,k,v)}catch(e){}}
function tmap(){try{return JSON.parse(lsGet(TKEY)||'{}')}catch(e){return {}}}
function setT(k,t){var m=tmap();m[k]=t;lsSet(TKEY,JSON.stringify(m))}

var act=null,user=null,db=null,api=null,pushTimer=0,applying=false,lastSync=0;

/* Theo dõi thay đổi để đẩy lên */
Storage.prototype.setItem=function(k,v){
  rawSet.call(this,k,v);
  if(this===window.localStorage&&!applying&&synced(k)){setT(k,Date.now());schedulePush()}
};
Storage.prototype.removeItem=function(k){
  rawRemove.call(this,k);
  if(this===window.localStorage&&!applying&&synced(k)){setT(k,Date.now());schedulePush()}
};

function localSnapshot(){
  var o={},t=tmap(),i,k;
  for(i=0;i<localStorage.length;i++){k=localStorage.key(i);if(synced(k))o[k]={v:localStorage.getItem(k),t:t[k]||0}}
  return o;
}

/* Gộp hai bản của thẻ ghi nhớ: hợp các từ, trùng thì lấy bản mới hơn */
function mergeFlash(a,b,aNewer){
  try{
    var A=JSON.parse(a),B=JSON.parse(b),out=Object.assign({},aNewer?B:A,aNewer?A:B);
    ['prog','bm','notes','flags'].forEach(function(f){
      out[f]=Object.assign({},(aNewer?B:A)[f]||{},(aNewer?A:B)[f]||{});
    });
    return JSON.stringify(out);
  }catch(e){return aNewer?a:b}
}
function pick(k,l,r){      /* l = cục bộ {v,t}, r = từ xa {v,t}; trả về giá trị chọn */
  if(l.v===r.v)return l.v;
  if(BEST.test(k)){var x=parseInt(l.v,10)||0,y=parseInt(r.v,10)||0;return String(Math.max(x,y))}
  if(k==='acc_study'){try{var A=JSON.parse(l.v),B=JSON.parse(r.v),o={};Object.keys(A).concat(Object.keys(B)).forEach(function(d){o[d]=Math.max(A[d]||0,B[d]||0)});return JSON.stringify(o)}catch(e){return l.v}}
  if(k==='tv_flashcard_v1')return mergeFlash(l.v,r.v,l.t>=r.t);
  return l.t>r.t?l.v:r.v;
}

async function pull(){
  if(!user||!db)return;
  var ref=api.doc(db,'users',user.uid),snap=await api.getDoc(ref);
  var remote=snap.exists()?(snap.data().items||{}):{},local=localSnapshot(),changedLocal=false,out={},keys={};
  Object.keys(remote).concat(Object.keys(local)).forEach(function(k){keys[k]=1});
  applying=true;
  Object.keys(keys).forEach(function(k){
    if(!synced(k))return;
    var l=local[k],r=remote[k],v;
    if(!r){out[k]=l;return}
    if(!l){lsSet(k,r.v);setT(k,r.t||Date.now());out[k]=r;changedLocal=true;return}
    v=pick(k,l,r);
    var t=Math.max(l.t||0,r.t||0)||Date.now();
    if(v!==l.v){lsSet(k,v);changedLocal=true}
    setT(k,t);out[k]={v:v,t:t};
  });
  applying=false;
  await api.setDoc(ref,{items:out,updated:Date.now(),email:user.email||''},{merge:true});
  act=(snap.exists()&&snap.data().activated)||null;
  lastSync=Date.now();
  if(changedLocal){
    var tag='tk_reload_'+user.uid;
    try{ if(!sessionStorage.getItem(tag)){sessionStorage.setItem(tag,'1');location.reload();return} }catch(e){}
  }
  render();
}
function schedulePush(){
  if(!user)return;clearTimeout(pushTimer);pushTimer=setTimeout(push,3000);
}
async function push(){
  if(!user||!db)return;
  try{
    var ref=api.doc(db,'users',user.uid);
    await api.setDoc(ref,{items:localSnapshot(),updated:Date.now(),email:user.email||''},{merge:true});
    lastSync=Date.now();
  }catch(e){}
}
window.addEventListener('pagehide',function(){if(pushTimer){clearTimeout(pushTimer);push()}});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'&&pushTimer){clearTimeout(pushTimer);push()}});

/* ---------- Giao diện ---------- */
var css='\
.acc-wrap{position:fixed;top:10px;right:14px;z-index:8500;font-family:"Be Vietnam Pro",system-ui,-apple-system,sans-serif}\
.acc-btn{display:flex;align-items:center;gap:8px;border:1px solid var(--border,rgba(0,0,0,.14));background:var(--surface,#fff);color:var(--text,#1d1d1f);border-radius:999px;padding:7px 14px 7px 8px;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.1);max-width:min(70vw,340px)}\
.acc-btn:hover{box-shadow:0 4px 14px rgba(0,0,0,.16)}\
.acc-btn.in{padding:4px 12px 4px 4px}\
.acc-btn .acc-g{width:22px;height:22px;flex:none}\
.acc-av{width:30px;height:30px;border-radius:50%;object-fit:cover;background:linear-gradient(135deg,#0071e3,#4f46e5);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;flex:none;overflow:hidden}\
.acc-hi{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.acc-hi small{font-weight:500;font-size:13px;color:var(--text-secondary,#6e6e73);margin-right:4px}\
.acc-caret{font-size:10px;color:var(--text-tertiary,#86868b);flex:none}\
.acc-menu{position:absolute;right:0;top:calc(100% + 8px);min-width:240px;background:var(--surface,#fff);color:var(--text,#1d1d1f);border:1px solid var(--border,rgba(0,0,0,.12));border-radius:14px;box-shadow:0 14px 40px rgba(0,0,0,.22);overflow:hidden;display:none;animation:acc-in .15s}\
.acc-menu.open{display:block}\
.acc-menu button,.acc-menu a{display:block;width:100%;text-align:left;border:0;background:none;color:inherit;font-family:inherit;font-weight:500;font-size:15px;padding:13px 18px;cursor:pointer;text-decoration:none;box-sizing:border-box}\
.acc-menu button+button,.acc-menu a+button,.acc-menu button+a{border-top:1px solid var(--border-soft,rgba(0,0,0,.07))}\
.acc-menu button:hover,.acc-menu a:hover{background:var(--surface-2,#f2f2f5)}\
.acc-menu .out{color:#d12c2c}.acc-mh{display:none;padding:12px 18px;font-size:13px;color:var(--text-secondary,#6e6e73);border-bottom:1px solid var(--border-soft,rgba(0,0,0,.07))}.acc-mh b{color:var(--text,#1d1d1f)}\
@keyframes acc-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}\
.acc-ov{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9600;display:flex;align-items:center;justify-content:center;padding:16px}\
.acc-box{background:var(--surface,#fff);color:var(--text,#1d1d1f);border-radius:20px;width:100%;max-width:440px;max-height:90vh;overflow:auto;padding:22px;box-shadow:0 24px 60px rgba(0,0,0,.35);font-family:"Be Vietnam Pro",system-ui,sans-serif;position:relative}\
.acc-box h3{margin:0 0 14px;font-size:18px}\
.acc-x{position:absolute;right:12px;top:12px;border:0;background:var(--surface-2,#f2f2f5);color:inherit;width:32px;height:32px;border-radius:50%;font-size:18px;cursor:pointer}\
.acc-prof{display:flex;align-items:center;gap:14px;margin-bottom:14px}.acc-prof .acc-av{width:58px;height:58px;font-size:24px}\
.acc-prof b{display:block;font-size:17px}.acc-prof span{color:var(--text-secondary,#6e6e73);font-size:14px;word-break:break-all}\
.acc-row{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid var(--border-soft,rgba(0,0,0,.07));font-size:14.5px}.acc-row span:first-child{color:var(--text-secondary,#6e6e73)}\
.acc-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.acc-st{background:var(--surface-2,#f5f5f7);border-radius:14px;padding:12px 14px}.acc-st b{display:block;font-size:24px;color:var(--blue,#0071e3)}.acc-st span{font-size:12.5px;color:var(--text-secondary,#6e6e73)}\
.acc-act{display:flex;flex-direction:column;gap:8px;margin-top:16px}.acc-act button{border:1px solid var(--border,rgba(0,0,0,.14));background:var(--surface,#fff);color:inherit;border-radius:12px;padding:11px;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer}.acc-act .danger{color:#d12c2c;border-color:rgba(209,44,44,.4)}\
.acc-note{font-size:12.5px;color:var(--text-secondary,#6e6e73);line-height:1.5;margin-top:12px}\
.acc-toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#1d1d1f;color:#fff;padding:10px 16px;border-radius:12px;font:600 13.5px system-ui;z-index:9700;max-width:88vw;text-align:center}\
.acc-code{display:flex;gap:8px;margin-top:10px}.acc-code input{flex:1;min-width:0;border:1.5px solid var(--border,rgba(0,0,0,.14));border-radius:12px;padding:11px 12px;font-family:inherit;font-weight:600;font-size:15px;line-height:1.2;background:var(--surface-2,#f5f5f7);color:inherit;text-transform:uppercase;letter-spacing:.05em;outline:none}.acc-code input:focus{border-color:var(--blue,#0071e3)}.acc-code button{border:0;background:linear-gradient(135deg,#0071e3,#4f46e5);color:#fff;border-radius:12px;padding:0 16px;font-family:inherit;font-weight:700;font-size:14px;cursor:pointer}\
.acc-msg{min-height:18px;margin:6px 0 0;font-size:13px}.acc-note a{color:var(--blue,#0071e3);font-weight:600}\
.acc-h4{margin:18px 0 8px;font-size:13px;color:var(--text-secondary,#6e6e73);text-transform:uppercase;letter-spacing:.04em}.acc-chart{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;height:110px;padding:0 4px}.acc-bar{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:5px;height:100%}.acc-bar i{display:block;width:100%;max-width:34px;border-radius:8px 8px 3px 3px;background:linear-gradient(180deg,#4f46e5,#0071e3)}.acc-bar small{font-size:11px;color:var(--text-secondary,#6e6e73)}\
@media (max-width:700px){.acc-wrap{top:8px;right:10px}.acc-btn{padding:6px 10px 6px 6px;font-size:13px}.acc-btn.in .acc-hi{display:none}.acc-btn.in{padding:4px 10px 4px 4px}.acc-mh{display:block!important}}\
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .acc-toast{background:#f5f5f7;color:#1d1d1f}}';
var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

var wrap=document.createElement('div');wrap.className='acc-wrap';document.body.appendChild(wrap);
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function toast(t){var d=document.createElement('div');d.className='acc-toast';d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove()},3200)}
var GICON='<svg class="acc-g" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';

function displayName(){return (user&&(user.displayName||(user.email||'').split('@')[0]))||'bạn'}
function avatar(){
  if(user&&user.photoURL)return '<img class="acc-av" referrerpolicy="no-referrer" src="'+esc(user.photoURL)+'" alt="">';
  return '<span class="acc-av">'+esc(displayName().charAt(0).toUpperCase())+'</span>';
}
function render(){
  if(!user){
    wrap.innerHTML='<button class="acc-btn" type="button">'+GICON+'<span class="acc-t">Đăng nhập</span></button>';
    wrap.firstChild.onclick=login;return;
  }
  wrap.innerHTML='<button class="acc-btn in" type="button" aria-haspopup="true">'+avatar()+'<span class="acc-hi"><small>Chào mừng,</small><b>'+esc(displayName())+'</b></span><span class="acc-caret">▼</span></button>'
   +'<div class="acc-menu" role="menu"><div class="acc-mh">Chào mừng, <b>'+esc(displayName())+'</b></div><button type="button" data-a="info">Thông tin tài khoản</button><button type="button" data-a="prog">Bảng tiến độ</button>'
   +'<a href="https://zalo.me/'+ZALO+'" target="_blank" rel="noopener">Liên hệ Zalo hỗ trợ</a>'
   +'<button type="button" class="out" data-a="out">Đăng xuất</button></div>';
  var btn=wrap.firstChild,menu=wrap.querySelector('.acc-menu');
  btn.onclick=function(e){e.stopPropagation();menu.classList.toggle('open')};
  menu.onclick=function(e){
    var a=e.target.closest('[data-a]');menu.classList.remove('open');if(!a)return;
    ({info:showInfo,prog:showProg,out:logout})[a.dataset.a]();
  };
}
document.addEventListener('click',function(e){var m=wrap.querySelector('.acc-menu');if(m&&!wrap.contains(e.target))m.classList.remove('open')});

function modal(html){
  var ov=document.createElement('div');ov.className='acc-ov';
  ov.innerHTML='<div class="acc-box"><button class="acc-x" type="button" aria-label="Đóng">×</button>'+html+'</div>';
  document.body.appendChild(ov);
  function close(){ov.remove()}
  ov.addEventListener('click',function(e){if(e.target===ov||e.target.classList.contains('acc-x'))close()});
  return {el:ov,close:close};
}
function fmtTime(t){return t?new Date(t).toLocaleString('vi-VN'):'Chưa đồng bộ'}
function showInfo(){
  var actHtml=act&&act.code
    ?'<div class="acc-row"><span>Trạng thái</span><span style="color:#1a9d4a;font-weight:700">✓ Đã kích hoạt</span></div><div class="acc-row"><span>Mã kích hoạt</span><span>'+esc(act.code)+'</span></div>'
    :'<div class="acc-row"><span>Trạng thái</span><span>Dùng thử</span></div>'
     +'<div class="acc-code"><input type="text" id="acc-code" placeholder="Nhập mã kích hoạt" autocomplete="off" autocapitalize="characters" spellcheck="false"><button type="button" data-a="act">Kích hoạt</button></div>'
     +'<p class="acc-msg" id="acc-msg"></p>';
  var m=modal('<h3>Thông tin tài khoản</h3><div class="acc-prof">'+avatar()+'<div><b>'+esc(displayName())+'</b><span>'+esc(user.email||'')+'</span></div></div>'
   +'<div class="acc-row"><span>Tên tài khoản</span><span>'+esc(displayName())+'</span></div>'
   +'<div class="acc-row"><span>Đăng nhập bằng</span><span>Google</span></div>'
   +'<div class="acc-row"><span>Đồng bộ gần nhất</span><span>'+esc(fmtTime(lastSync))+'</span></div>'
   +actHtml
   +'<div class="acc-act"><button type="button" data-a="sync">🔄 Đồng bộ ngay</button><button type="button" class="danger" data-a="del">🗑 Xóa tài khoản và dữ liệu</button></div>'
   +'<p class="acc-note">Cần mã kích hoạt? Nhắn Zalo Admin: <a href="https://zalo.me/'+ZALO+'" target="_blank" rel="noopener">'+ZALO+'</a>.<br>Tiến độ học được lưu theo tài khoản để dùng trên nhiều thiết bị. Chỉ bạn đọc được dữ liệu này.</p>');
  m.el.onclick=async function(e){
    if(e.target===m.el||e.target.classList.contains('acc-x')){m.close();return}
    var a=e.target.getAttribute&&e.target.getAttribute('data-a');
    if(a==='sync'){try{await push();toast('Đã đồng bộ ✓');m.close()}catch(x){toast('Chưa đồng bộ được, thử lại nhé')}}
    if(a==='act'){
      var inp=m.el.querySelector('#acc-code'),msg=m.el.querySelector('#acc-msg'),code=(inp.value||'').trim().toUpperCase();
      if(!/^[A-Z0-9-]{4,32}$/.test(code)){msg.textContent='Mã chưa đúng định dạng.';return}
      msg.style.color='';msg.textContent='Đang kiểm tra…';
      try{var r=await activate(code);msg.style.color='#1a9d4a';msg.textContent=r;setTimeout(function(){m.close();showInfo()},900)}
      catch(x){msg.style.color='#d12c2c';msg.textContent=(x&&x.message)||'Mã không hợp lệ hoặc đã được dùng.'}
    }
    if(a==='del'){
      if(!confirm('Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu đã đồng bộ? Dữ liệu trên thiết bị này vẫn giữ lại.'))return;
      try{await deleteAccount();m.close();toast('Đã xóa tài khoản')}catch(x){toast('Chưa xóa được, bạn đăng xuất, đăng nhập lại rồi thử nữa nhé')}
    }
  };
}
/* Kích hoạt: mỗi mã (do Admin tạo trong Firestore, collection "codes") dùng được cho một tài khoản */
async function activate(code){
  var cref=api.doc(db,'codes',code),snap=await api.getDoc(cref);
  if(!snap.exists())throw new Error('Mã không tồn tại.');
  var d=snap.data()||{};
  if(d.usedBy&&d.usedBy!==user.uid)throw new Error('Mã này đã được dùng cho tài khoản khác.');
  if(!d.usedBy)await api.updateDoc(cref,{usedBy:user.uid,usedAt:Date.now()});
  await api.setDoc(api.doc(db,'users',user.uid),{activated:{code:code,at:Date.now()}},{merge:true});
  act={code:code,at:Date.now()};
  return 'Kích hoạt thành công 🎉';
}

/* ---------- Đếm thời gian học mỗi ngày (chỉ tính lúc đang mở trang và có thao tác) ---------- */
function dayKey(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function studyMap(){try{return JSON.parse(lsGet('acc_study')||'{}')||{}}catch(e){return {}}}
var lastAct=Date.now(),pend=0,flushAt=0;
['pointerdown','keydown','scroll','touchstart','mousemove'].forEach(function(ev){window.addEventListener(ev,function(){lastAct=Date.now()},{passive:true,capture:true})});
setInterval(function(){
  if(document.visibilityState!=='visible'||Date.now()-lastAct>60000)return;
  pend+=5;
  if(pend>=30)flushStudy();
},5000);
function flushStudy(){
  if(!pend)return;
  var m=studyMap(),k=dayKey();m[k]=(m[k]||0)+pend;pend=0;
  var v=JSON.stringify(m);rawSet.call(localStorage,'acc_study',v);setT('acc_study',Date.now());schedulePush();
}
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')flushStudy()});
window.addEventListener('pagehide',flushStudy);
function fmtDur(s){
  s=Math.round(s);var h=Math.floor(s/3600),mi=Math.round((s%3600)/60);
  if(mi===60){h++;mi=0}
  if(h>0)return h+' giờ'+(mi?' '+mi+' phút':'');
  if(mi>0)return mi+' phút';
  return s>0?'<1 phút':'0 phút';
}
function showProg(){
  flushStudy();
  var m=studyMap(),days=Object.keys(m).filter(function(k){return m[k]>=60}),total=0,i;
  Object.keys(m).forEach(function(k){total+=m[k]||0});
  var today=m[dayKey()]||0,avg=days.length?total/days.length:0;
  /* chuỗi ngày liên tiếp tính đến hôm nay (hoặc hôm qua) */
  var streak=0,d=new Date();if(!(m[dayKey(d)]>=60))d.setDate(d.getDate()-1);
  while(m[dayKey(d)]>=60){streak++;d.setDate(d.getDate()-1)}
  /* 7 ngày gần nhất */
  var bars='',max=1,list=[];
  for(i=6;i>=0;i--){var dd=new Date();dd.setDate(dd.getDate()-i);var s=m[dayKey(dd)]||0;list.push({d:dd,s:s});if(s>max)max=s}
  list.forEach(function(x){
    var h=Math.max(3,Math.round(x.s*84/max)),lab=['CN','T2','T3','T4','T5','T6','T7'][x.d.getDay()];
    bars+='<div class="acc-bar"><i style="height:'+(x.s?h:3)+'px" title="'+esc(fmtDur(x.s))+'"></i><small>'+lab+'</small></div>';
  });
  var S={};try{S=JSON.parse(lsGet('tv_flashcard_v1')||'{}')}catch(e){}
  var prog=S.prog||{},thuoc=0;Object.keys(prog).forEach(function(k){if(prog[k]&&prog[k].s==='thuoc')thuoc++});
  modal('<h3>Bảng tiến độ</h3><div class="acc-stats">'
   +'<div class="acc-st"><b>'+fmtDur(total)+'</b><span>Tổng thời gian học</span></div>'
   +'<div class="acc-st"><b>'+days.length+'</b><span>Số ngày đã học</span></div>'
   +'<div class="acc-st"><b>'+fmtDur(today)+'</b><span>Hôm nay</span></div>'
   +'<div class="acc-st"><b>'+streak+'</b><span>Ngày liên tiếp</span></div>'
   +'<div class="acc-st"><b>'+fmtDur(avg)+'</b><span>Trung bình mỗi ngày học</span></div>'
   +'<div class="acc-st"><b>'+thuoc+'</b><span>Từ đã thuộc</span></div></div>'
   +'<h4 class="acc-h4">7 ngày gần nhất</h4><div class="acc-chart">'+bars+'</div>'
   +'<p class="acc-note">Thời gian chỉ tính khi bạn đang mở trang và có thao tác. Một ngày được tính là đã học khi học từ 1 phút trở lên.</p>');
}

/* ---------- Đăng nhập / đăng xuất / xóa ---------- */
var provider,authApi;
async function login(){
  try{
    await ensure();
    try{ await authApi.signInWithPopup(auth,provider) }
    catch(e){
      var c=e&&e.code;
      if(c==='auth/popup-blocked'||c==='auth/operation-not-supported-in-this-environment'){await authApi.signInWithRedirect(auth,provider)}
      else if(c!=='auth/popup-closed-by-user'&&c!=='auth/cancelled-popup-request')throw e;
    }
  }catch(e){toast('Đăng nhập chưa được: '+((e&&e.code)||'lỗi mạng').replace('auth/',''))}
}
async function logout(){
  try{await push()}catch(e){}
  await authApi.signOut(auth);toast('Đã đăng xuất');
}
async function deleteAccount(){
  var uid=user.uid;
  await api.deleteDoc(api.doc(db,'users',uid));
  try{await authApi.deleteUser(auth.currentUser)}
  catch(e){
    if(e&&e.code==='auth/requires-recent-login'){await authApi.reauthenticateWithPopup(auth.currentUser,provider);await authApi.deleteUser(auth.currentUser)}
    else throw e;
  }
}

var auth,ready;
function ensure(){
  if(ready)return ready;
  ready=(async function(){
    var app=await import(FB+'firebase-app.js'),a=await import(FB+'firebase-auth.js'),f=await import(FB+'firebase-firestore.js');
    var inst=app.initializeApp(CFG);
    authApi=a;auth=a.getAuth(inst);provider=new a.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
    api=f;db=f.getFirestore(inst);
    a.onAuthStateChanged(auth,async function(u){
      user=u||null;render();
      if(user){try{await pull()}catch(e){toast('Chưa đồng bộ được dữ liệu')}}
    });
    a.getRedirectResult(auth).catch(function(){});
  })();
  ready.catch(function(e){ready=null;console.warn('acc init',e&&e.message)});
  return ready;
}

render();
/* Khởi tạo sớm để nhận lại phiên đăng nhập đã lưu (sau khi trang rảnh) */
(window.requestIdleCallback||function(f){setTimeout(f,1200)})(function(){ensure().catch(function(){})});
})();
