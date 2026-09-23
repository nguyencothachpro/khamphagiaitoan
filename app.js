const messages=document.getElementById("messages"),promptEl=document.getElementById("prompt"),fileInput=document.getElementById("fileInput"),attachBtn=document.getElementById("attachBtn"),sendBtn=document.getElementById("sendBtn"),attachmentsEl=document.getElementById("attachments"),clearBtn=document.getElementById("clearBtn");
let files=[],conversation=[];
attachBtn.onclick=()=>fileInput.click();
fileInput.onchange=()=>{addFiles([...fileInput.files]);fileInput.value=""};
document.addEventListener("paste",e=>{const imgs=[...e.clipboardData.items].filter(i=>i.type.startsWith("image/")).map(i=>i.getAsFile()).filter(Boolean);if(imgs.length)addFiles(imgs)});
["dragenter","dragover"].forEach(x=>document.addEventListener(x,e=>{if(e.dataTransfer&&e.dataTransfer.files.length){e.preventDefault();document.body.classList.add("drop")}}));
document.addEventListener("drop",e=>{document.body.classList.remove("drop");if(e.dataTransfer&&e.dataTransfer.files.length){e.preventDefault();addFiles([...e.dataTransfer.files])}});
document.addEventListener("dragleave",()=>document.body.classList.remove("drop"));
function addFiles(list){files.push(...list);renderFiles()}
function renderFiles(){attachmentsEl.innerHTML=files.map((f,i)=>'<div class="file-chip">📎 '+escapeHtml(f.name)+' <button data-i="'+i+'">×</button></div>').join("");attachmentsEl.querySelectorAll("button").forEach(b=>b.onclick=()=>{files.splice(+b.dataset.i,1);renderFiles()})}
document.querySelectorAll("[data-example]").forEach(b=>b.onclick=()=>{promptEl.value=b.dataset.example;resize();promptEl.focus()});
clearBtn.onclick=()=>{files=[];conversation=[];renderFiles();messages.innerHTML='<div class="welcome"><div class="mark">∑</div><h1>Đưa bài toán cho tôi</h1><p>Anh có thể <b>gõ đề</b>, <b>dán ảnh chụp màn hình</b>, kéo thả ảnh hoặc <b>đính kèm PDF/Word/ảnh</b>. Tôi sẽ cùng anh phân tích và giải theo đúng cách mình đã thống nhất.</p></div>'};
promptEl.addEventListener("input",resize);function resize(){promptEl.style.height="auto";promptEl.style.height=Math.min(promptEl.scrollHeight,180)+"px"}promptEl.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}});sendBtn.onclick=send;
async function send(){
 const text=promptEl.value.trim();if(!text&&!files.length)return;
 const current=[...files];files=[];renderFiles();promptEl.value="";resize();addMessage("user",text,current);
 const userContent=[];if(text)userContent.push({type:"input_text",text});const serialized=await serializeFiles(current);serialized.forEach(f=>{userContent.push(f.type.startsWith("image/")?{type:"input_image",image_url:f.data}:{type:"input_file",filename:f.name,file_data:f.data})});
 conversation.push({role:"user",content:userContent});
 const typing=addTyping();sendBtn.disabled=true;
 try{
   const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({history:conversation})});
   const data=await r.json();typing.remove();if(!r.ok)throw new Error(data.error||"Không thể kết nối.");
   conversation.push({role:"assistant",content:[{type:"output_text",text:data.text||""}]});
   addMessage("assistant",data.text||"Không có nội dung trả lời.");
 }catch(err){typing.remove();conversation.pop();addMessage("assistant","Có lỗi: "+err.message+"\n\nNếu đây là lần đầu triển khai, hãy kiểm tra biến môi trường OPENAI_API_KEY trên Vercel.");}
 finally{sendBtn.disabled=false;promptEl.focus()}
}
async function serializeFiles(list){return Promise.all(list.map(async f=>({name:f.name,type:f.type||"application/octet-stream",data:await toDataUrl(f)})))}function toDataUrl(f){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f)})}
function addMessage(role,text,files){const row=document.createElement("div");row.className="msg "+role;const av=role==="assistant"?'<div class="avatar">∑</div>':"";let previews=(files||[]).map(f=>f.type.startsWith("image/")?'<div class="attachment-preview"><img src="'+f.data+'"><span>'+escapeHtml(f.name)+'</span></div>':'<div class="attachment-preview">📎 '+escapeHtml(f.name)+'</div>').join("");const bubble='<div class="bubble">'+format(text)+previews+'</div>';row.innerHTML=role==="assistant"?av+bubble:bubble;messages.appendChild(row);window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"})}
function addTyping(){const row=document.createElement("div");row.className="msg assistant";row.innerHTML='<div class="avatar">∑</div><div class="bubble"><div class="typing"><i></i><i></i><i></i></div></div>';messages.appendChild(row);window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"});return row}
function format(s){return escapeHtml(s).replace(/\*\*(.*?)\*\*/g,"<b>$1</b>").replace(/\n/g,"<br>")}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}