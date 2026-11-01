/* Nhớ vị trí đang học: chức năng, giáo trình, bài, nửa bài, vị trí thẻ Flashcard — © 2026 Học TOCFL cùng Thịnh & Loan
   Lưu ở localStorage khóa "acc_state"; khi đăng nhập, khóa này được đồng bộ theo tài khoản (xem tai-khoan.js)
   nên đóng trình duyệt, đăng xuất hay đổi thiết bị vào lại vẫn đúng chỗ đang học. */
(function(){
'use strict';
var KEY='acc_state',st=null,restored=false,touched=false,fcDone=false,timer=0,cur={};
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){return null}}
st=read();
function write(){
  timer=0;
  if(!touched)return;   /* chưa có thao tác thật của người dùng thì không ghi đè (tránh xóa vị trí đã lưu khi vừa đồng bộ từ tài khoản) */
  try{
    var tb=document.querySelector('.tab-btn.active'),e=(typeof LESSON_SYNC!=='undefined')&&LESSON_SYNC[0],o={t:Date.now()};
    o.tab=tb?tb.dataset.tab:(cur.tab||'home');
    if(e){o.book=e.bookSel.value;o.lesson=e.selectEl.value;if(typeof PART!=='undefined')o.part=PART}
    if(cur.fc)o.fc=cur.fc;
    localStorage.setItem(KEY,JSON.stringify(o));
  }catch(e){}
}
function save(){if(!restored)return;clearTimeout(timer);timer=setTimeout(write,600)}

/* Flashcard: nhớ thẻ đang xem của bài đang chọn */
window.ACC_STATE={
  fc:function(lesson,idx,mode,shuffled){
    if(mode!=='normal'||shuffled)return;
    if(cur.fc&&cur.fc.lesson===lesson&&cur.fc.idx===idx)return;
    cur.fc={lesson:lesson,idx:idx};save();
  },
  fcRestore:function(lesson){
    if(fcDone||!st||!st.fc||st.fc.lesson!==lesson)return 0;
    fcDone=true;cur.fc=st.fc;return st.fc.idx||0;
  }
};

function fire(el){el.dispatchEvent(new Event('change',{bubbles:true}))}
function restore(){
  try{
    var G=window.ACC_GATE;
    if(st&&typeof LESSON_SYNC!=='undefined'&&LESSON_SYNC[0]){
      var e=LESSON_SYNC[0];
      var bookBad=st.book&&G&&G.bookLocked&&G.bookLocked(st.book);
      if(st.book&&!bookBad){
        e.bookSel.value=st.book;
        if(e.bookSel.value===st.book){
          fire(e.bookSel);
          var lessonBad=st.lesson&&st.lesson.charAt(0)!=='@'&&G&&G.locked&&G.locked(st.lesson);
          if(st.lesson&&!lessonBad){e.selectEl.value=st.lesson;if(e.selectEl.value===st.lesson)fire(e.selectEl)}
          if(st.part&&e.partSel&&st.part!==(typeof PART!=='undefined'?PART:'all')){e.partSel.value=st.part;if(e.partSel.value===st.part)fire(e.partSel)}
        }
      }
    }
    if(st&&st.tab&&st.tab!=='home'){
      var tb=document.querySelector('.tab-btn[data-tab="'+st.tab+'"]');
      if(tb&&!tb.classList.contains('active'))tb.click();
    }
  }catch(err){}
  restored=true;
}

/* Chỉ coi là người dùng đã thao tác khi có sự kiện thật (không phải do code khôi phục tạo ra) */
['pointerdown','keydown','touchstart'].forEach(function(ev){window.addEventListener(ev,function(e){if(e.isTrusted)touched=true},true)});
/* Theo dõi thay đổi để lưu */
document.addEventListener('click',function(ev){var t=ev.target;if(t&&t.closest&&t.closest('.tab-btn'))save()},true);
document.addEventListener('change',function(ev){var id=ev.target&&ev.target.id;if(id&&/^(bookFilter|lessonFilter|partFilter)/.test(id))save()},true);
window.addEventListener('pagehide',function(){if(restored){clearTimeout(timer);write()}});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'&&restored){clearTimeout(timer);write()}});

if(document.readyState==='complete')setTimeout(restore,0);
else window.addEventListener('load',function(){setTimeout(restore,0)});
})();
