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

  const mapSteps=j.map_discovery_steps||[];
  const mapStepsByMap=problemMaps.map((_,mapIndex)=>mapSteps.filter(s=>Number(s.map_index)===mapIndex));
  const guidedMapsHtml=mapStepsByMap.map((steps,mapIndex)=>{
    if(!steps.length)return '';
    const stepCards=steps.map((s,i)=>
      '<div class="guided-step '+(i===0?'active':'locked')+'" data-step="'+i+'">'+
        '<div class="guided-step-no">'+(i+1)+'</div>'+
        '<div class="guided-step-body">'+
          '<div class="guided-kicker">GV DẪN DẮT</div>'+
          '<h4>'+esc(s.step_title||('Bước '+(i+1)))+'</h4>'+
          '<div class="guided-question">❓ '+esc(s.teacher_question||'')+'</div>'+
          '<div class="student-goal">🎯 Học sinh cần nhận ra: '+esc(s.student_goal||'')+'</div>'+
          '<textarea class="guided-answer" rows="2" placeholder="Học sinh trả lời tại đây…"></textarea>'+
          '<div class="guided-actions"><button class="hint-btn" type="button">💡 Gợi ý</button><button class="unlock-btn" type="button">✓ Học sinh đã trả lời → mở mảnh</button></div>'+
          '<div class="guided-hint hidden">💡 '+esc(s.hint||'')+'</div>'+
          '<div class="guided-wrong hidden">↩️ Nếu học sinh bí/sai: '+esc(s.if_wrong||'')+'</div>'+
          '<details class="teacher-answer"><summary>👨‍🏫 Xem đáp án dành cho giáo viên</summary><div>'+esc(s.expected_answer||'')+'</div></details>'+
          '<div class="unlocked-piece hidden">✨ Mảnh sơ đồ mở ra: <b>'+esc(s.unlock||'')+'</b></div>'+
        '</div>'+
      '</div>'
    ).join('');
    return '<div class="guided-map" data-map="'+mapIndex+'"><div class="guided-map-head"><span>🎓</span><div><b>Tự dựng sơ đồ — Cách '+(mapIndex+1)+'</b><small>Giáo viên hỏi → học sinh suy luận → mở từng mảnh sơ đồ</small></div></div><div class="guided-steps">'+stepCards+'</div><div class="guided-complete hidden">🎉 Học sinh đã tự dựng xong sơ đồ. Bây giờ hãy hỏi: <b>“Các mảnh này liên hệ với nhau thế nào để tạo thành cách giải?”</b></div></div>';
  }).join('');
  const problemMaps=j.problem_maps||[];
  const problemMapsHtml=problemMaps.map((problemMap,mapIndex)=>{
    const mapBranches=(problemMap.branches||[]).map((b,i)=>
      '<div class="pm-branch"><div class="pm-label">'+esc(b.label||('Phần '+(i+1)))+'</div><div class="pm-expression">'+esc(b.expression||'')+'</div></div>'
    ).join('');
    return '<div class="problem-map-card">'+
      '<div class="pm-method"><span class="pm-method-no">'+(mapIndex+1)+'</span><div><b>'+esc(problemMap.method_title||('Cách giải '+(mapIndex+1)))+'</b><span>'+esc(problemMap.method_note||'')+'</span></div></div>'+
      '<div class="pm-diagram">'+
        '<div class="pm-root">'+esc(problemMap.root||'Bài toán')+'</div>'+
        '<div class="pm-vline"></div>'+
        '<div class="pm-branches">'+mapBranches+'</div>'+
        '<div class="pm-hub-line"></div>'+
        '<div class="pm-conclusion"><div>'+esc(problemMap.conclusion_label||'Mối quan hệ')+'</div><strong>'+esc(problemMap.conclusion_value||'')+'</strong></div>'+
      '</div>'+
      '<div class="pm-explanation"><b>💡 Chú giải:</b> '+esc(problemMap.explanation||'')+'</div>'+
    '</div>';
  }).join('');
  const problemText=j.problem?.text||j.task||j.summary||'Bài toán cần khám phá';
  const evidenceLegend=(j.evidence||[]).map((e,i)=>
    '<span class="legend-item"><i>D'+(i+1)+'</i>'+esc(e.label||'Dấu vết '+(i+1))+'</span>'
  ).join('');

  journey.innerHTML=
    '<div class="journey-head"><div><h2>'+esc(j.title||'Hành Trình Khám Phá Toán')+'</h2><p>'+esc(j.summary||'')+'</p></div></div>'+
    '<div class="tree"><div class="branch"><h3>👨‍🎓 HỌC SINH</h3><ul><li>'+esc(j.student?.grade||'Chọn lớp 6–9')+'</li><li>'+esc(j.student?.topic||'Chọn chủ đề')+'</li><li>'+esc(j.student?.task||'Chọn bài toán')+'</li></ul></div>'+
    '<div class="branch"><h3>👨‍🏫 GIÁO VIÊN</h3><ul><li>'+esc(j.teacher?.lesson_goal||'Mục tiêu bài học')+'</li><li>'+esc(j.teacher?.mystery||'Bí ẩn')+'</li><li>'+esc(j.teacher?.clue_strategy||'Chiến lược khám phá')+'</li></ul></div></div>'+
    '<div class="problem-maps">'+
      '<div class="pm-title"><span class="eyebrow">🧩 SƠ ĐỒ TÓM TẮT BÀI TOÁN</span><h3>'+((problemMaps.length>1)?'Mỗi cách giải có một sơ đồ riêng':'Nhìn nhanh cấu trúc bài toán trước khi khám phá')+'</h3></div>'+
      problemMapsHtml+
    '</div>'+
    (guidedMapsHtml?'<div class="guided-discovery">'+
      '<div class="guided-title"><span class="eyebrow">🎓 GIÁO VIÊN DẪN HỌC SINH TỰ SUY LUẬN</span><h3>Không đưa sơ đồ trước — từng mảnh chỉ xuất hiện sau câu trả lời của học sinh</h3></div>'+
      guidedMapsHtml+
    '</div>':'')+
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
    const steps=[...map.querySelectorAll('.guided-step')];
    steps.forEach((step,i)=>{
      step.querySelector('.hint-btn')?.addEventListener('click',()=>{
        step.querySelector('.guided-hint')?.classList.remove('hidden');
        step.querySelector('.guided-wrong')?.classList.remove('hidden');
      });
      step.querySelector('.unlock-btn')?.addEventListener('click',()=>{
        step.querySelector('.unlocked-piece')?.classList.remove('hidden');
        step.classList.add('completed');
        if(steps[i+1]){
          steps[i+1].classList.remove('locked');
          steps[i+1].classList.add('active');
          setTimeout(()=>steps[i+1].scrollIntoView({behavior:'smooth',block:'center'}),80);
        }else{
          map.querySelector('.guided-complete')?.classList.remove('hidden');
        }
      });
    });
  });
}
function addHistory(t){const d=document.createElement("div");d.className="history-item";d.textContent=t.slice(0,38);historyEl.prepend(d)}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}