/* Khóa nội dung theo tài khoản Pro — © 2026 Học TOCFL cùng Thịnh & Loan
   Chạy ngay sau data.js: tài khoản Pro thì nạp thêm data-pro.js (từ vựng các bài khóa).
   Quy tắc: Đương Đại 1/2/3 (A1, A2, B1) chỉ mở 5 bài đầu · Novice 1–2 và Ngữ pháp mở hết · Level 1–5, TOCFL Band A đầy đủ (BA), Luyện phản xạ và Lona cần Pro. */
(function(){
'use strict';
var ZALO='0939509695',FREE_LESSONS=5;
var pro=false;try{pro=localStorage.getItem('acc_pro')==='1'}catch(e){}
function bookOf(l){var m=(l||'').match(/^\[([^\]]+)\]/);return m?m[1]:''}
function bookLocked(b){return /^(L[1-5]|BA)$/.test(b)}
function lessonLocked(l){
  var b=bookOf(l);
  if(bookLocked(b))return true;
  if(b==='A1'||b==='A2'||b==='B1'){var m=(l||'').match(/BÀI\s*(\d+)/);return !!m&&parseInt(m[1],10)>FREE_LESSONS}
  return false;
}
var G=window.ACC_GATE={
  pro:pro,ZALO:ZALO,
  locked:function(l){return !pro&&lessonLocked(l)},
  bookLocked:function(b){return !pro&&bookLocked(b)},
  setPro:function(v){try{localStorage.setItem('acc_pro',v?'1':'0')}catch(e){}}
};
/* Dữ liệu chia 2 phần: data.js (miễn phí) luôn tải; data-pro.js (bài khóa) chỉ tải khi là tài khoản Pro.
   Nhờ vậy người dùng thường tải ít hơn nhiều, trang mở nhanh hơn. Viết bằng document.write để chạy xong trước các script chính. */
if(pro){document.write('<script src="data-pro.js?v=2"><\/script>')}

/* ---------- Hộp thoại mời nâng cấp ---------- */
var css='\
.gt-ov{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9800;display:flex;align-items:center;justify-content:center;padding:16px}\
.gt-box{background:var(--surface,#fff);color:var(--text,#1d1d1f);border-radius:22px;width:100%;max-width:400px;padding:26px 22px 20px;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.35);font-family:"Be Vietnam Pro",system-ui,sans-serif;position:relative}\
.gt-ic{font-size:46px;line-height:1}.gt-box h3{margin:10px 0 6px;font-size:19px}.gt-box p{margin:0 0 16px;font-size:14.5px;line-height:1.55;color:var(--text-secondary,#6e6e73)}\
.gt-box button,.gt-box a.gt-b{display:block;width:100%;box-sizing:border-box;border-radius:14px;padding:13px;margin-top:8px;font-family:inherit;font-weight:700;font-size:15px;cursor:pointer;text-decoration:none;border:1.5px solid var(--border,rgba(0,0,0,.14));background:var(--surface,#fff);color:inherit}\
.gt-box .gt-p{border:0;color:#fff;background:linear-gradient(135deg,#0071e3,#4f46e5);box-shadow:0 4px 14px rgba(79,70,229,.35)}\
.gt-box .gt-c{border:0;background:none;color:var(--text-secondary,#6e6e73);font-weight:600;font-size:14px}\
.gt-lock{position:absolute;right:-2px;top:-2px;width:22px;height:22px;border-radius:50%;background:#1d1d1f;color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center;border:2px solid #fff}';
var st=document.createElement('style');st.textContent=css;
(document.head||document.documentElement).appendChild(st);

var WHY={
  lesson:['Bài học này dành cho tài khoản Pro','Bạn đang dùng bản học thử: mỗi giáo trình Đương Đại mở 5 bài đầu. Nâng cấp Pro để mở toàn bộ bài học và các cấp độ Level 1–5.'],
  book:['Cấp độ này dành cho tài khoản Pro','Level 1–5 và TOCFL Band A đầy đủ chỉ mở cho tài khoản Pro. Novice 1, Novice 2 và Ngữ pháp bạn vẫn học miễn phí.'],
  reflex:['Luyện phản xạ dành cho Pro','Luyện phản xạ chỉ mở cho tài khoản Pro. Nâng cấp Pro để luyện dịch câu không giới hạn.'],
  lona:['Trò chuyện với Lona dành cho Pro','Lona là cô giáo AI trả lời từ vựng, ngữ pháp và sửa câu cho bạn. Nâng cấp tài khoản Pro để trò chuyện không giới hạn.']
};
var open=null;
G.upsell=function(kind){
  if(open)return;
  var t=WHY[kind]||WHY.lesson,api=window.ACC_API,ov=document.createElement('div');ov.className='gt-ov';open=ov;
  var main=api?(api.loggedIn()?'<button type="button" class="gt-p" data-g="code">Nhập mã kích hoạt Pro</button>':'<button type="button" class="gt-p" data-g="login">Đăng nhập để kích hoạt Pro</button>'):'';
  ov.innerHTML='<div class="gt-box"><div class="gt-ic">🔒</div><h3>'+t[0]+'</h3><p>'+t[1]+'</p>'+main
    +'<a class="gt-b" href="https://zalo.me/'+ZALO+'" target="_blank" rel="noopener">Nhắn Zalo Admin để lấy mã · '+ZALO+'</a><button type="button" class="gt-c" data-g="x">Để sau</button></div>';
  document.body.appendChild(ov);
  function close(){ov.remove();open=null}
  ov.addEventListener('click',function(e){
    var g=e.target.getAttribute&&e.target.getAttribute('data-g');
    if(e.target===ov||g==='x'){close();return}
    if(g==='login'){close();api.login()}
    if(g==='code'){close();api.info()}
  });
};

/* Chọn giáo trình/bài bị khóa trong bộ chọn → mở hộp thoại mời nâng cấp */
document.addEventListener('change',function(e){
  var el=e.target;if(pro||!el||!el.id)return;
  if(el.id==='rx-book'||el.id==='rx-part'){e.stopImmediatePropagation();if(el.id==='rx-book')el.value='-1';G.upsell('reflex');return}
  if(/^bookFilter/.test(el.id)&&bookLocked(el.value))G.upsell('book');
  else if(/^lessonFilter/.test(el.id)){
    var v=el.value||'';
    if(v.charAt(0)==='@'?bookLocked(v.slice(1)):lessonLocked(v))G.upsell(bookLocked(bookOf(v.charAt(0)==='@'?'['+v.slice(1)+']':v))?'book':'lesson');
  }
},true);
})();
