const $=s=>document.querySelector(s);const promptEl=$("#prompt"),send=$("#send"),attach=$("#attach"),file=$("#file"),filesEl=$("#files"),journey=$("#journey"),intro=$("#intro"),status=$("#status"),provider=$("#provider"),historyEl=$("#history");let files=[];let lastInput="";
attach.onclick=()=>file.click();file.onchange=()=>{addFiles([...file.files]);file.value=""};
document.addEventListener("paste",e=>{const imgs=[...e.clipboardData.items].filter(i=>i.type.startsWith("image/")).map(i=>i.getAsFile()).filter(Boolean);if(imgs.length){e.preventDefault();addFiles(imgs)}});
["dragenter","dragover"].forEach(x=>document.addEventListener(x,e=>{if(e.dataTransfer?.files?.length){e.preventDefault();document.body.classList.add("drag")}}));document.addEventListener("drop",e=>{document.body.classList.remove("drag");if(e.dataTransfer?.files?.length){e.preventDefault();addFiles([...e.dataTransfer.files])}});document.addEventListener("dragleave",()=>document.body.classList.remove("drag"));
function addFiles(a){files.push(...a);renderFiles()}function renderFiles(){filesEl.innerHTML=files.map((f,i)=>'<div class="file-chip">📎 '+esc(f.name)+' <button data-i="'+i+'">×</button></div>').join("");filesEl.querySelectorAll("button").forEach(b=>b.onclick=()=>{files.splice(+b.dataset.i,1);renderFiles()})}
promptEl.addEventListener("input",()=>{promptEl.style.height="auto";promptEl.style.height=Math.min(promptEl.scrollHeight,150)+"px"});promptEl.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();run()}});
$("#newBtn").onclick=()=>{files=[];renderFiles();journey.className="journey hidden";journey.innerHTML="";intro.classList.remove("hidden");promptEl.value="";status.textContent="Sẵn sàng"};
$("#menu").onclick=()=>$("#sidebar").classList.toggle("open");
const apiKeyBtn=document.createElement("button");apiKeyBtn.id="apiKeyBtn";apiKeyBtn.className="key-btn";apiKeyBtn.textContent="🔑 API key";document.querySelector(".side-foot").prepend(apiKeyBtn);
apiKeyBtn.onclick=openKeyDialog;
function keyStorageName(){return "khamphagiaitoan_api_key_"+provider.value}
function getApiKey(){return localStorage.getItem(keyStorageName())||""}
function refreshKeyButton(){apiKeyBtn.textContent=getApiKey()?"🔑 Đã có API key":"🔑 Nhập API key"}
provider.onchange=refreshKeyButton;refreshKeyButton();
function openKeyDialog(){
 const old=document.querySelector(".key-modal");if(old)old.remove();
 const name=provider.value==="gemini"?"Gemini API key":"OpenAI API key";
 const modal=document.createElement("div");modal.className="key-modal";
 modal.innerHTML='<div class="key-box"><button class="key-close">×</button><div class="eyebrow">CẤU HÌNH AI</div><h3>'+name+'</h3><p>Nhập key của anh để website dùng key riêng cho các lần tạo hành trình. Key được lưu <b>chỉ trên trình duyệt này</b> và gửi qua HTTPS cùng yêu cầu AI; website không hiển thị lại đầy đủ key.</p><input id="keyInput" type="password" autocomplete="off" placeholder="Dán API key vào đây..." value="'+esc(getApiKey())+'"><label class="show-key"><input id="showKey" type="checkbox"> Hiện key</label><div class="key-actions"><button id="keyCancel">Hủy</button><button id="keySave">Lưu trên máy này</button></div></div>';
 document.body.appendChild(modal);
 const input=modal.querySelector("#keyInput");modal.querySelector("#showKey").onchange=e=>input.type=e.target.checked?"text":"password";
 modal.querySelector(".key-close").onclick=()=>modal.remove();modal.querySelector("#keyCancel").onclick=()=>modal.remove();
 modal.querySelector("#keySave").onclick=()=>{const v=input.value.trim();if(v)localStorage.setItem(keyStorageName(),v);else localStorage.removeItem(keyStorageName());refreshKeyButton();modal.remove()};
 input.focus();
}
async function run(){const text=promptEl.value.trim();if(!text&&!files.length)return;lastInput=text;status.textContent="Đang xây hành trình…";send.disabled=true;intro.classList.add("hidden");journey.className="journey";journey.innerHTML='<div class="loading">Đang đọc đề và dựng Hành Trình Khám Phá…</div>';try{const payload={provider:provider.value,prompt:text,files:await encodeFiles(files),apiKey:getApiKey()};const r=await fetch("/api/journey",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await r.json();if(!r.ok)throw new Error(data.error||"Không tạo được hành trình");renderJourney(data.journey);addHistory(data.journey?.title||text||"Bài toán mới");status.textContent="Đã tạo hành trình"}catch(e){journey.innerHTML='<div class="error"><b>Không tạo được hành trình.</b><br>'+esc(e.message)+'</div>';status.textContent="Có lỗi"}finally{send.disabled=false}}
async function encodeFiles(a){return Promise.all(a.map(f=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res({name:f.name,type:f.type||"application/octet-stream",data:r.result});r.onerror=rej;r.readAsDataURL(f)})))}
function renderJourney(j){
  const evidence=(j.evidence||[]).map((e,i)=>
    '<div class="an-node evidence-node" data-id="D'+(i+1)+'">'+
      '<div class="an-node-top"><span class="node">D'+(i+1)+'</span><span class="an-type">DẤU VẾT</span></div>'+
      '<b>'+esc(e.label||'Dấu vết '+(i+1))+'</b>'+
      '<div class="quote">“'+esc(e.quote||'')+'”</div>'+
      '<p>'+esc(e.why_notice||'')+'</p>'+
      '<div class="question">🔎 '+esc(e.question||'')+'</div>'+
    '</div>'
  ).join('');

  const clues=(j.clues||[]).map((c,i)=>{
    const q=(c.guiding_questions||[]).map(x=>'<div class="question">❓ '+esc(x)+'</div>').join('');
    return '<div class="an-node clue-node" data-id="M'+(i+1)+'">'+
      '<div class="an-node-top"><span class="node">M'+(i+1)+'</span><span class="an-type">MANH MỐI</span></div>'+
      '<b>'+esc(c.title||'Manh mối')+'</b>'+
      '<div class="from">← Từ: '+esc((c.from_evidence||[]).join(', '))+'</div>'+
      '<p><b>Đang truy tìm:</b> '+esc(c.discovery_goal||'')+'</p>'+
      '<details class="clue-detail"><summary>🔎 Lần theo manh mối</summary>'+q+
        '<div class="hint">💡 Gợi ý khi bí: '+esc(c.hint||'')+'</div>'+
      '</details>'+
    '</div>';
  }).join('');

  const discoveries=(j.discoveries||[]).map((d,i)=>
    '<div class="an-node discovery-node" data-id="P'+(i+1)+'">'+
      '<div class="an-node-top"><span class="node">P'+(i+1)+'</span><span class="an-type">PHÁT HIỆN</span></div>'+
      '<b>'+esc(d.title||'Phát hiện')+'</b>'+
      '<p>'+esc(d.content||'')+'</p>'+
      '<small>← Từ manh mối: '+esc((d.from_clues||[]).join(', '))+'</small>'+
      '<div class="why">Vì sao quan trọng: '+esc(d.why_it_matters||'')+'</div>'+
    '</div>'
  ).join('');

  const connections=(j.connections||[]).map((x,i)=>
    '<div class="connection-line">'+
      '<span class="conn-dot">'+(i+1)+'</span>'+
      '<b>'+esc(x.from||'')+'</b><span class="conn-arrow">→</span><b>'+esc(x.to||'')+'</b>'+
      '<span class="conn-reason">'+esc(x.reason||'')+'</span>'+
    '</div>'
  ).join('');

  const solutionSteps=(j.solution?.steps||[]).map((s,i)=>
    '<div class="hand-step"><div class="hand-label">'+esc(s.label||('Bước '+(i+1)))+'</div>'+
    '<div class="hand-content">'+esc(s.content||'')+'</div>'+
    (s.why?'<div class="hand-why">Vì: '+esc(s.why)+'</div>':'')+
    '</div>'
  ).join('');

  const practices=(j.practice||[]).map((p,i)=>
    '<div class="practice-item"><b>Bài '+(i+1)+' — '+esc(p.level||'')+'</b><p>'+esc(p.problem||'')+'</p></div>'
  ).join('');

  const problemMaps=j.problem_maps||[];
  const mapSteps=j.map_discovery_steps||[];
  const mapStepsByMap=problemMaps.map((_,mapIndex)=>mapSteps.filter(s=>Number(s.map_index)===mapIndex));

  function buildProgressiveMap(problemMap,steps,mapIndex){
    const root=esc(problemMap.root||'Bài toán');
    const branches=(problemMap.branches||[]).map((b,i)=>
      '<div class="pm-live-branch">'+
        '<div class="pm-live-label" data-piece="'+esc(b.label||('Phần '+(i+1)))">'+esc(b.label||('Phần '+(i+1)))+'</div>'+
        '<div class="pm-live-expression hidden" data-piece="'+esc(b.expression||'')+'">'+esc(b.expression||'')+'</div>'+
      '</div>'
    ).join('');
    const unlocks=steps.map(s=>esc(s.unlock||'')).join('|');
    return '<div class="guided-map" data-map="'+mapIndex+'">'+
      '<div class="guided-map-head"><span>🎓</span><div><b>Học sinh tự dựng sơ đồ — '+esc(problemMap.method_title||('Cách giải '+(mapIndex+1)))+'</b><small>'+esc(problemMap.method_note||'Giáo viên không đưa sơ đồ trước; học sinh tự mở từng mảnh từ câu hỏi.</small></div></div>'+
      '<div class="guided-progress"><span class="progress-count">Bước 1/'+steps.length+'</span><div class="progress-track"><i style="width:0%"></i></div></div>'+
      '<div class="pm-live-map" data-unlocks="'+unlocks+'">'+
        '<div class="pm-live-root hidden" data-piece="'+root+'">'+root+'</div>'+
        '<div class="pm-live-vline hidden"></div>'+
        '<div class="pm-live-branches hidden">'+branches+'</div>'+
        '<div class="pm-live-hub hidden"></div>'+
        '<div class="pm-live-conclusion hidden"><div data-piece="'+esc(problemMap.conclusion_label||'')+'">'+esc(problemMap.conclusion_label||'')+'</div><strong data-piece="'+esc(problemMap.conclusion_value||'')+'">'+esc(problemMap.conclusion_value||'')+'</strong></div>'+
      '</div>'+
      '<div class="guided-current">'+
        steps.map((s,i)=>
          '<div class="guided-step-data" data-step="'+i+'" data-unlock="'+esc(s.unlock||'')+'" data-expected="'+esc(s.expected_answer||'')+'" data-hint="'+esc(s.hint||'')+'" data-wrong="'+esc(s.if_wrong||'')+'" data-question="'+esc(s.teacher_question||'')+'" data-title="'+esc(s.step_title||('Bước '+(i+1)))+'" data-goal="'+esc(s.student_goal||'')+'"></div>'
        ).join('')+
        '<div class="guided-live-kicker">GV DẪN DẮT — BƯỚC <span class="current-no">1</span></div>'+
        '<h4 class="current-title">'+esc(steps[0]?.step_title||'Bắt đầu khám phá')+'</h4>'+
        '<div class="guided-question current-question">❓ '+esc(steps[0]?.teacher_question||'')+'</div>'+
        '<div class="student-goal current-goal">🎯 Học sinh cần nhận ra: '+esc(steps[0]?.student_goal||'')+'</div>'+
        '<textarea class="guided-answer current-answer" rows="2" placeholder="Học sinh trả lời tại đây…"></textarea>'+
        '<div class="guided-actions"><button class="hint-btn" type="button">💡 Gợi ý</button><button class="confirm-btn" type="button">✓ Học sinh đã suy luận → mở mảnh sơ đồ</button></div>'+
        '<div class="guided-hint hidden current-hint"></div>'+
        '<div class="guided-wrong hidden current-wrong"></div>'+
        '<details class="teacher-answer"><summary>👨‍🏫 Giáo viên xem đáp án</summary><div class="current-expected"></div></details>'+
        '<div class="unlocked-piece hidden current-unlock"></div>'+
      '</div>'+
      '<div class="guided-complete hidden"><div class="complete-badge">🎉 Học sinh đã tự dựng xong sơ đồ</div><div class="pm-final-explanation">💡 Chú giải: '+esc(problemMap.explanation||'')+'</div><div class="complete-next">Bây giờ hỏi: <b>“Các mảnh này liên hệ với nhau thế nào để tạo thành cách giải?”</b></div></div>'+
    '</div>';
  }

  const guidedMapsHtml=mapStepsByMap.map((steps,mapIndex)=>steps.length?buildProgressiveMap(problemMaps[mapIndex],steps,mapIndex):'').join('');
  journey.innerHTML=
    '<div class="journey-head"><div><h2>'+esc(j.title||'Hành Trình Khám Phá Toán')+'</h2><p>'+esc(j.summary||'')+'</p></div></div>'+
    '<div class="tree"><div class="branch"><h3>👨‍🎓 HỌC SINH</h3><ul><li>'+esc(j.student?.grade||'Chọn lớp 6–9')+'</li><li>'+esc(j.student?.topic||'Chọn chủ đề')+'</li><li>'+esc(j.student?.task||'Chọn bài toán')+'</li></ul></div>'+
    '<div class="branch"><h3>👨‍🏫 GIÁO VIÊN</h3><ul><li>'+esc(j.teacher?.lesson_goal||'Mục tiêu bài học')+'</li><li>'+esc(j.teacher?.mystery||'Bí ẩn')+'</li><li>'+esc(j.teacher?.clue_strategy||'Chiến lược khám phá')+'</li></ul></div></div>'+
    '<div class="guided-discovery">'+
      '<div class="guided-title"><span class="eyebrow">🎓 GIÁO VIÊN DẪN HỌC SINH TỰ XÂY DỰNG SƠ ĐỒ</span><h3>Sơ đồ không xuất hiện sẵn — mỗi mảnh chỉ xuất hiện sau một lần suy luận</h3></div>'+
      guidedMapsHtml+
    '</div>'+
    '<div class="anatomy">'+
      '<div class="anatomy-title"><span class="eyebrow">🧬 GIẢI PHẪU BÀI TOÁN</span><h3>Không đọc bài toán như một khối chữ — tách nó thành các dấu vết và lần theo chúng</h3></div>'+
      '<div class="anatomy-legend">'+evidenceLegend+'</div>'+
      '<div class="an-stage problem-stage">'+
        '<div class="an-core"><div class="core-kicker">🧩 BÀI TOÁN</div><div class="core-text">'+esc(problemText)+'</div><div class="core-mystery">❓ '+esc(j.mystery?.title||'Bí ẩn cần giải')+'</div></div>'+
        '<div class="an-arrow">↓</div><div class="stage-label">1 · TÌM DẤU VẾT</div>'+
        '<div class="an-grid evidence-grid">'+evidence+'</div>'+
      '</div>'+
      '<div class="an-connector">↓ <span>mỗi dấu vết mở ra một hướng điều tra</span> ↓</div>'+
      '<div class="an-stage clue-stage-map"><div class="stage-label">2 · LẦN THEO DẤU VẾT → MANH MỐI</div><div class="an-grid clue-grid">'+clues+'</div></div>'+
      '<div class="an-connector split">↙ <span>khám phá</span> ↘</div>'+
      '<div class="an-stage discovery-stage-map"><div class="stage-label">3 · KHÁM PHÁ → PHÁT HIỆN</div><div class="an-grid discovery-grid">'+discoveries+'</div></div>'+
      '<div class="an-connector">↓ <span>nối những gì đã phát hiện</span> ↓</div>'+
      '<div class="an-stage connection-stage-map"><div class="stage-label">4 · KẾT NỐI CÁC PHÁT HIỆN</div><div class="connection-map">'+connections+'</div>'+
        '<div class="reveal"><b>✨ '+esc(j.synthesis?.title||'Cách giải lóe ra')+'</b><p>'+esc(j.synthesis?.chain||'')+'</p><strong>'+esc(j.synthesis?.reveal||'')+'</strong></div>'+
      '</div>'+
    '</div>'+
    '<div class="flow">'+
      '<div class="step"><div class="card mystery"><div class="eyebrow">🧩 BÍ ẨN</div><h3>❓ '+esc(j.mystery?.title||'')+'</h3><p>'+esc(j.mystery?.context||'')+'</p></div></div>'+
      '<div class="step"><div class="card standard"><div class="eyebrow">📖 CHUẨN HÓA</div><h3>'+esc(j.standardization?.concept||'Kiến thức cần hình thành')+'</h3><p>'+esc(j.standardization?.knowledge||'')+'</p></div></div>'+
      '<div class="step"><div class="card solution-paper"><div class="eyebrow">✍️ LỜI GIẢI CHUẨN</div><h3>'+esc(j.solution?.title||'Bài giải')+'</h3><div class="hand-paper"><div class="hand-title">Bài giải</div>'+solutionSteps+'<div class="hand-final">'+esc(j.solution?.final_answer||'')+'</div></div></div></div>'+
      '<div class="step"><div class="card practice"><div class="eyebrow">📝 LUYỆN TẬP</div><h3>5 bài theo hành trình</h3><div class="practice-list">'+practices+'</div></div></div>'+
      '<div class="step"><div class="card application"><div class="eyebrow">🎯 VẬN DỤNG</div><h3>'+esc(j.application?.title||'Chuyển giao kiến thức')+'</h3><p>'+esc(j.application?.task||'')+'</p></div></div>'+
    '</div>';
  initGuidedMaps();
}
function initGuidedMaps(){
  document.querySelectorAll('.guided-map').forEach(map=>{
    const data=[...map.querySelectorAll('.guided-step-data')];
    const root=map.querySelector('.pm-live-root');
    const branches=map.querySelector('.pm-live-branches');
    const vline=map.querySelector('.pm-live-vline');
    const hub=map.querySelector('.pm-live-hub');
    const conclusion=map.querySelector('.pm-live-conclusion');
    const currentNo=map.querySelector('.current-no');
    const title=map.querySelector('.current-title');
    const question=map.querySelector('.current-question');
    const goal=map.querySelector('.current-goal');
    const answer=map.querySelector('.current-answer');
    const hint=map.querySelector('.current-hint');
    const wrong=map.querySelector('.current-wrong');
    const expected=map.querySelector('.current-expected');
    const unlockBox=map.querySelector('.current-unlock');
    const progress=map.querySelector('.progress-count');
    const progressBar=map.querySelector('.progress-track i');
    const complete=map.querySelector('.guided-complete');
    let index=0;

    function renderStep(){
      const d=data[index];
      if(!d)return;
      currentNo.textContent=index+1;
      progress.textContent='Bước '+(index+1)+'/'+data.length;
      progressBar.style.width=(index/data.length*100)+'%';
      title.textContent=d.dataset.title||'';
      question.innerHTML='❓ '+esc(d.dataset.question||'');
      goal.textContent='🎯 Học sinh cần nhận ra: '+(d.dataset.goal||'');
      answer.value='';
      hint.classList.add('hidden'); wrong.classList.add('hidden'); unlockBox.classList.add('hidden');
      hint.textContent='💡 '+(d.dataset.hint||'');
      wrong.textContent='↩️ Nếu học sinh bí/sai: '+(d.dataset.wrong||'');
      expected.textContent=d.dataset.expected||'';
      map.querySelector('.confirm-btn').disabled=false;
      answer.focus();
    }
    function reveal(unlock){
      const key=String(unlock||'').trim().toLowerCase();
      if(!key)return;
      const els=map.querySelectorAll('[data-piece]');
      let found=false;
      els.forEach(el=>{
        const value=String(el.getAttribute('data-piece')||'').trim().toLowerCase();
        if(value===key || value.includes(key) || key.includes(value)){
          el.classList.remove('hidden','piece-hidden'); el.classList.add('piece-revealed'); found=true;
        }
      });
      if(index===0){root?.classList.remove('hidden');vline?.classList.remove('hidden')}
      if(index>0){branches?.classList.remove('hidden')}
      if(index>=data.length-1){hub?.classList.remove('hidden');conclusion?.classList.remove('hidden');}
      unlockBox.innerHTML='✨ Mảnh sơ đồ vừa mở: <b>'+esc(unlock)+'</b>';
      unlockBox.classList.remove('hidden');
      progressBar.style.width=((index+1)/data.length*100)+'%';
      return found;
    }
    map.querySelector('.hint-btn')?.addEventListener('click',()=>{
      hint.classList.remove('hidden'); wrong.classList.remove('hidden');
    });
    map.querySelector('.confirm-btn')?.addEventListener('click',()=>{
      const unlock=data[index]?.dataset.unlock||'';
      reveal(unlock);
      if(index<data.length-1){
        index++;
        setTimeout(renderStep,350);
      }else{
        map.querySelector('.confirm-btn').disabled=true;
        complete.classList.remove('hidden');
        complete.scrollIntoView({behavior:'smooth',block:'center'});
      }
    });
    renderStep();
  });
}
function addHistory(t){const d=document.createElement("div");d.className="history-item";d.textContent=t.slice(0,38);historyEl.prepend(d)}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}