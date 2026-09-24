const $=s=>document.querySelector(s);
const promptEl=$("#prompt"),send=$("#send"),attach=$("#attach"),file=$("#file"),filesEl=$("#files"),journey=$("#journey"),intro=$("#intro"),status=$("#status"),provider=$("#provider"),historyEl=$("#history");
let files=[];

function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

function addFiles(list){files.push(...list);renderFiles();}
function renderFiles(){
  filesEl.innerHTML=files.map((f,i)=>'<div class="file-chip">📎 '+esc(f.name)+' <button type="button" data-i="'+i+'">×</button></div>').join("");
  filesEl.querySelectorAll("button").forEach(b=>b.onclick=()=>{files.splice(Number(b.dataset.i),1);renderFiles();});
}

attach.addEventListener("click",()=>file.click());
file.addEventListener("change",()=>{addFiles([...file.files]);file.value="";});

document.addEventListener("paste",e=>{
  const items=[...(e.clipboardData?.items||[])];
  const images=items.filter(i=>i.type.startsWith("image/")).map(i=>i.getAsFile()).filter(Boolean);
  if(images.length){e.preventDefault();addFiles(images);}
});

["dragenter","dragover"].forEach(type=>document.addEventListener(type,e=>{
  if(e.dataTransfer?.files?.length){e.preventDefault();document.body.classList.add("drag");}
}));
document.addEventListener("dragleave",e=>{if(!e.relatedTarget)document.body.classList.remove("drag");});
document.addEventListener("drop",e=>{
  document.body.classList.remove("drag");
  if(e.dataTransfer?.files?.length){e.preventDefault();addFiles([...e.dataTransfer.files]);}
});

promptEl.addEventListener("input",()=>{promptEl.style.height="auto";promptEl.style.height=Math.min(promptEl.scrollHeight,150)+"px";});
promptEl.addEventListener("keydown",e=>{
  if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();run();}
});

$("#newBtn").onclick=()=>{
  files=[];renderFiles();journey.className="journey hidden";journey.innerHTML="";
  intro.classList.remove("hidden");promptEl.value="";status.textContent="Sẵn sàng";
};
$("#menu").onclick=()=>$("#sidebar").classList.toggle("open");

const apiKeyBtn=document.createElement("button");
apiKeyBtn.id="apiKeyBtn";apiKeyBtn.className="key-btn";document.querySelector(".side-foot").prepend(apiKeyBtn);
function keyStorageName(){return "khamphagiaitoan_api_key_"+provider.value;}
function getApiKey(){return localStorage.getItem(keyStorageName())||"";}
function refreshKeyButton(){apiKeyBtn.textContent=getApiKey()?"🔑 Đã có API key":"🔑 Nhập API key";}
provider.onchange=refreshKeyButton;refreshKeyButton();

apiKeyBtn.onclick=()=>{
  const old=document.querySelector(".key-modal");if(old)old.remove();
  const name=provider.value==="gemini"?"Gemini API key":"OpenAI API key";
  const modal=document.createElement("div");modal.className="key-modal";
  modal.innerHTML='<div class="key-box"><button class="key-close" type="button">×</button><div class="eyebrow">CẤU HÌNH AI</div><h3>'+name+'</h3><p>Nhập key để website dùng key riêng cho các lần tạo hành trình.</p><input id="keyInput" type="password" autocomplete="off" placeholder="Dán API key vào đây..." value="'+esc(getApiKey())+'"><label class="show-key"><input id="showKey" type="checkbox"> Hiện key</label><div class="key-actions"><button id="keyCancel" type="button">Hủy</button><button id="keySave" type="button">Lưu trên máy này</button></div></div>';
  document.body.appendChild(modal);
  const input=modal.querySelector("#keyInput");
  modal.querySelector("#showKey").onchange=e=>input.type=e.target.checked?"text":"password";
  modal.querySelector(".key-close").onclick=()=>modal.remove();
  modal.querySelector("#keyCancel").onclick=()=>modal.remove();
  modal.querySelector("#keySave").onclick=()=>{const v=input.value.trim();if(v)localStorage.setItem(keyStorageName(),v);else localStorage.removeItem(keyStorageName());refreshKeyButton();modal.remove();};
  input.focus();
};

async function encodeFiles(list){
  return Promise.all(list.map(f=>new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=()=>resolve({name:f.name,type:f.type||"application/octet-stream",data:r.result});
    r.onerror=reject;r.readAsDataURL(f);
  })));
}

async function run(){
  const text=promptEl.value.trim();
  if(!text&&!files.length)return;
  status.textContent="Đang xây hành trình…";send.disabled=true;
  intro.classList.add("hidden");journey.className="journey";journey.innerHTML='<div class="loading">Đang đọc đề và dựng Hành Trình Khám Phá…</div>';
  try{
    const r=await fetch("/api/journey",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider:provider.value,prompt:text,files:await encodeFiles(files),apiKey:getApiKey()})});
    const data=await r.json();
    if(!r.ok)throw new Error(data.error||"Không tạo được hành trình");
    renderJourney(data.journey);addHistory(data.journey?.title||text||"Bài toán mới");status.textContent="Đã tạo hành trình";
  }catch(e){
    journey.innerHTML='<div class="error"><b>Không tạo được hành trình.</b><br>'+esc(e.message)+'</div>';status.textContent="Có lỗi";
  }finally{send.disabled=false;}
}

function buildProgressiveMap(map,steps,index){
  if(!map||!steps.length)return "";
  const branches=(map.branches||[]).map((b,i)=>'<div class="pm-live-branch"><div class="pm-live-label hidden" data-piece="'+esc(b.label||("Phần "+(i+1)))+'">'+esc(b.label||("Phần "+(i+1)))+'</div><div class="pm-live-expression hidden" data-piece="'+esc(b.expression||"")+'">'+esc(b.expression||"")+'</div></div>').join("");
  const data=steps.map((s,i)=>'<div class="guided-step-data" data-step="'+i+'" data-unlock="'+esc(s.unlock||"")+'" data-expected="'+esc(s.expected_answer||"")+'" data-hint="'+esc(s.hint||"")+'" data-wrong="'+esc(s.if_wrong||"")+'" data-question="'+esc(s.teacher_question||"")+'" data-title="'+esc(s.step_title||("Bước "+(i+1)))+'" data-goal="'+esc(s.student_goal||"")+'"></div>').join("");
  return '<div class="guided-map" data-map="'+index+'"><div class="guided-map-head"><span>🎓</span><div><b>Giáo viên thiết kế đường suy luận — '+esc(map.method_title||("Cách giải "+(index+1)))+'</b><small>'+esc(map.method_note||"Giáo viên hỏi → học sinh suy luận → sơ đồ hình thành.")+'</small></div></div><div class="guided-progress"><span class="progress-count">Bước 1/'+steps.length+'</span><div class="progress-track"><i style="width:0%"></i></div></div><div class="pm-live-map"><div class="pm-live-root hidden" data-piece="'+esc(map.root||"Bài toán")+'">'+esc(map.root||"Bài toán")+'</div><div class="pm-live-vline hidden"></div><div class="pm-live-branches hidden">'+branches+'</div><div class="pm-live-hub hidden"></div><div class="pm-live-conclusion hidden"><div data-piece="'+esc(map.conclusion_label||"")+'">'+esc(map.conclusion_label||"")+'</div><strong data-piece="'+esc(map.conclusion_value||"")+'">'+esc(map.conclusion_value||"")+'</strong></div></div><div class="guided-current"><div class="guided-live-kicker">GV NGHIÊN CỨU — BƯỚC <span class="current-no">1</span></div><h4 class="current-title"></h4><div class="guided-question current-question"></div><div class="student-goal current-goal"></div><div class="teacher-expected"><span>🧠 Học sinh dự kiến tự nhận ra</span><b class="current-expected"></b></div><div class="guided-actions"><button class="hint-btn" type="button">💡 Xem gợi ý sư phạm</button><button class="confirm-btn" type="button">▶ Xem bước tiếp theo → mở mảnh sơ đồ</button></div><div class="guided-hint hidden current-hint"></div><div class="guided-wrong hidden current-wrong"></div><details class="teacher-answer"><summary>👨‍🏫 Chi tiết thiết kế bước dạy</summary><div class="current-design"></div></details><div class="unlocked-piece hidden current-unlock"></div></div><div class="guided-complete hidden"><div class="complete-badge">🎉 Học sinh đã tự dựng xong sơ đồ</div><div class="pm-final-explanation">💡 Chú giải: '+esc(map.explanation||"")+'</div><div class="complete-next">Bây giờ hỏi: <b>“Các mảnh này liên hệ với nhau thế nào để tạo thành cách giải?”</b></div></div></div>';
}

function initGuidedMaps(){
  document.querySelectorAll(".guided-map").forEach(map=>{
    const data=[...map.querySelectorAll(".guided-step-data")];
    let index=0;
    const root=map.querySelector(".pm-live-root"),branches=map.querySelector(".pm-live-branches"),vline=map.querySelector(".pm-live-vline"),hub=map.querySelector(".pm-live-hub"),conclusion=map.querySelector(".pm-live-conclusion");
    const no=map.querySelector(".current-no"),title=map.querySelector(".current-title"),question=map.querySelector(".current-question"),goal=map.querySelector(".current-goal"),hint=map.querySelector(".current-hint"),wrong=map.querySelector(".current-wrong"),expected=map.querySelector(".current-expected"),design=map.querySelector(".current-design"),unlock=map.querySelector(".current-unlock"),count=map.querySelector(".progress-count"),bar=map.querySelector(".progress-track i"),complete=map.querySelector(".guided-complete");

    function renderStep(){
      const d=data[index];if(!d)return;
      no.textContent=index+1;count.textContent="Bước "+(index+1)+"/"+data.length;bar.style.width=(index/data.length*100)+"%";
      title.textContent=d.dataset.title||"";
      question.textContent="❓ "+(d.dataset.question||"");
      goal.textContent="🎯 Học sinh cần nhận ra: "+(d.dataset.goal||"");
      expected.textContent=d.dataset.expected||"";
      hint.textContent="💡 "+(d.dataset.hint||"");wrong.textContent="↩️ Nếu học sinh bí/sai: "+(d.dataset.wrong||"");
      hint.classList.add("hidden");wrong.classList.add("hidden");unlock.classList.add("hidden");
    }
    function reveal(value){
      const key=String(value||"").trim().toLowerCase();
      if(!key)return;
      map.querySelectorAll("[data-piece]").forEach(el=>{
        const p=String(el.getAttribute("data-piece")||"").trim().toLowerCase();
        if(p===key||p.includes(key)||key.includes(p))el.classList.remove("hidden");
      });
      if(index===0){root.classList.remove("hidden");vline.classList.remove("hidden");}
      if(index>0)branches.classList.remove("hidden");
      if(index>=data.length-1){hub.classList.remove("hidden");conclusion.classList.remove("hidden");}
      unlock.innerHTML="✨ Mảnh sơ đồ vừa mở: <b>"+esc(value)+"</b>";unlock.classList.remove("hidden");
      bar.style.width=((index+1)/data.length*100)+"%";
    }
    map.querySelector(".hint-btn").onclick=()=>{hint.classList.remove("hidden");wrong.classList.remove("hidden");};
    map.querySelector(".confirm-btn").onclick=()=>{
      reveal(data[index].dataset.unlock||"");
      if(index<data.length-1){index++;setTimeout(renderStep,250);}
      else{map.querySelector(".confirm-btn").disabled=true;complete.classList.remove("hidden");}
    };
    renderStep();
  });
}

function renderJourney(j){
  const maps=j.problem_maps||[],steps=j.map_discovery_steps||[];
  const guided=maps.map((m,i)=>buildProgressiveMap(m,steps.filter(s=>Number(s.map_index)===i),i)).join("");
  const evidence=(j.evidence||[]).map((e,i)=>'<div class="an-node evidence-node"><div class="an-node-top"><span class="node">D'+(i+1)+'</span><span class="an-type">DẤU VẾT</span></div><b>'+esc(e.label||"Dấu vết "+(i+1))+'</b><div class="quote">“'+esc(e.quote||"")+'”</div><p>'+esc(e.why_notice||"")+'</p><div class="question">🔎 '+esc(e.question||"")+'</div></div>').join("");
  const clues=(j.clues||[]).map((c,i)=>'<div class="an-node clue-node"><div class="an-node-top"><span class="node">M'+(i+1)+'</span><span class="an-type">MANH MỐI</span></div><b>'+esc(c.title||"Manh mối")+'</b><div class="from">← Từ: '+esc((c.from_evidence||[]).join(", "))+'</div><p><b>Đang truy tìm:</b> '+esc(c.discovery_goal||"")+'</p><details class="clue-detail"><summary>🔎 Lần theo manh mối</summary>'+(c.guiding_questions||[]).map(q=>'<div class="question">❓ '+esc(q)+'</div>').join("")+'<div class="hint">💡 '+esc(c.hint||"")+'</div></details></div>').join("");
  const discoveries=(j.discoveries||[]).map((d,i)=>'<div class="an-node discovery-node"><div class="an-node-top"><span class="node">P'+(i+1)+'</span><span class="an-type">PHÁT HIỆN</span></div><b>'+esc(d.title||"Phát hiện")+'</b><p>'+esc(d.content||"")+'</p><small>← Từ: '+esc((d.from_clues||[]).join(", "))+'</small><div class="why">Vì sao quan trọng: '+esc(d.why_it_matters||"")+'</div></div>').join("");
  const connections=(j.connections||[]).map((x,i)=>'<div class="connection-line"><span class="conn-dot">'+(i+1)+'</span><b>'+esc(x.from||"")+'</b><span class="conn-arrow">→</span><b>'+esc(x.to||"")+'</b><span class="conn-reason">'+esc(x.reason||"")+'</span></div>').join("");
  const solution=(j.solution?.steps||[]).map((s,i)=>'<div class="hand-step"><div class="hand-label">'+esc(s.label||"Bước "+(i+1))+'</div><div class="hand-content">'+esc(s.content||"")+'</div>'+(s.why?'<div class="hand-why">Vì: '+esc(s.why)+'</div>':"")+'</div>').join("");
  const practice=(j.practice||[]).map((p,i)=>'<div class="practice-item"><b>Bài '+(i+1)+" — "+esc(p.level||"")+'</b><p>'+esc(p.problem||"")+'</p></div>').join("");
  journey.innerHTML='<div class="journey-head"><h2>'+esc(j.title||"Hành Trình Khám Phá Toán")+'</h2><p>'+esc(j.summary||"")+'</p></div><div class="tree"><div class="branch"><h3>👨‍🎓 HỌC SINH</h3><ul><li>'+esc(j.student?.grade||"")+'</li><li>'+esc(j.student?.topic||"")+'</li><li>'+esc(j.student?.task||"")+'</li></ul></div><div class="branch"><h3>👨‍🏫 GIÁO VIÊN</h3><ul><li>'+esc(j.teacher?.lesson_goal||"")+'</li><li>'+esc(j.teacher?.mystery||"")+'</li><li>'+esc(j.teacher?.clue_strategy||"")+'</li></ul></div></div><div class="guided-discovery"><div class="guided-title"><span class="eyebrow">🎓 GIÁO VIÊN DẪN HỌC SINH TỰ XÂY DỰNG SƠ ĐỒ</span><h3>Mô phỏng cách giáo viên dẫn dắt học sinh tự xây dựng sơ đồ</h3></div>'+guided+'</div><div class="anatomy"><div class="anatomy-title"><span class="eyebrow">🧬 GIẢI PHẪU BÀI TOÁN</span><h3>Tìm dấu vết → lần theo manh mối → khám phá → kết nối</h3></div><div class="an-stage problem-stage"><div class="an-core"><div class="core-kicker">🧩 BÀI TOÁN</div><div class="core-text">'+esc(j.student?.task||j.summary||"")+'</div><div class="core-mystery">❓ '+esc(j.mystery?.title||"Bí ẩn cần giải")+'</div></div></div><div class="an-connector">↓</div><div class="stage-label">1 · TÌM DẤU VẾT</div><div class="an-grid evidence-grid">'+evidence+'</div><div class="an-connector">↓</div><div class="stage-label">2 · LẦN THEO DẤU VẾT → MANH MỐI</div><div class="an-grid clue-grid">'+clues+'</div><div class="an-connector">↓</div><div class="stage-label">3 · KHÁM PHÁ → PHÁT HIỆN</div><div class="an-grid discovery-grid">'+discoveries+'</div><div class="an-connector">↓</div><div class="stage-label">4 · KẾT NỐI</div><div class="connection-map">'+connections+'</div><div class="reveal"><b>✨ '+esc(j.synthesis?.title||"Cách giải lóe ra")+'</b><p>'+esc(j.synthesis?.chain||"")+'</p><strong>'+esc(j.synthesis?.reveal||"")+'</strong></div></div><div class="flow"><div class="step"><div class="card standard"><div class="eyebrow">📖 CHUẨN HÓA</div><h3>'+esc(j.standardization?.concept||"")+'</h3><p>'+esc(j.standardization?.knowledge||"")+'</p></div></div><div class="step"><div class="card solution-paper"><div class="eyebrow">✍️ LỜI GIẢI CHUẨN</div><h3>'+esc(j.solution?.title||"Bài giải")+'</h3><div class="hand-paper"><div class="hand-title">Bài giải</div>'+solution+'<div class="hand-final">'+esc(j.solution?.final_answer||"")+'</div></div></div></div><div class="step"><div class="card practice"><div class="eyebrow">📝 LUYỆN TẬP</div><h3>5 bài theo hành trình</h3><div class="practice-list">'+practice+'</div></div></div></div>';
  initGuidedMaps();
}

function addHistory(t){const d=document.createElement("div");d.className="history-item";d.textContent=String(t).slice(0,38);historyEl.prepend(d);}
