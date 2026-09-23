const stages=[
{tag:"BÍ ẨN",title:"P có thể là những số nguyên nào?",prompt:'Ta đã biến đổi được biểu thức thành <strong>P = 1 − 7/(√x + 3)</strong>. Chưa cần tính x. Hãy nhìn vào mẫu số.',question:"Vì x > 0, √x chắc chắn như thế nào?",choices:["√x > 0","√x = 0","√x < 0"],correct:0,explain:"Đúng. Với x > 0 thì căn bậc hai √x là số dương."},
{tag:"MANH MỐI",title:"Mẫu số đang nói cho ta điều gì?",prompt:"Ta biết √x > 0. Vậy so với 3, số √x + 3 như thế nào?",question:"Chọn phát biểu đúng.",choices:["√x + 3 > 3","√x + 3 = 3","√x + 3 < 3"],correct:0,explain:"Đúng. Cộng 3 vào hai vế của √x > 0 ta được √x + 3 > 3."},
{tag:"KHÁM PHÁ",title:"Đặt một ẩn phụ để nhìn rõ hơn",prompt:"Gọi <strong>T = 7/(√x + 3)</strong>. Vì mẫu số dương và lớn hơn 3, T có tính chất gì?",question:"Chọn khoảng đúng cho T.",choices:["0 < T < 7/3","T > 7/3","T < 0"],correct:0,explain:"Đúng. T dương và vì mẫu lớn hơn 3 nên phân số nhỏ hơn 7/3."},
{tag:"KHÁM PHÁ",title:"P nằm ở đâu trên trục số?",prompt:"Ta có P = 1 − T và 0 < T < 7/3. Hãy trừ khoảng này từ 1.",question:"Khoảng nào đúng?",choices:["−4/3 < P < 1","1 < P < 4/3","−1 < P < 4/3"],correct:0,explain:"Đúng. Tăng trưởng của mẫu số làm phân số giảm; từ 0 < T < 7/3 suy ra 1−7/3 < P < 1."},
{tag:"CHUẨN HÓA",title:"Bây giờ hãy lọc các số nguyên",prompt:"P nằm trong khoảng (−4/3; 1). Những số nguyên nào nằm trong khoảng này?",question:"Chọn tập số nguyên của P.",choices:["{−1, 0}","{−2, −1, 0}","{0, 1}"],correct:0,explain:"Đúng. Vì −4/3 = −1,333... nên các số nguyên nằm giữa −4/3 và 1 là −1 và 0."}
];
let step=0, unlocked=false;
const stageTag=document.getElementById("stageTag"),stageTitle=document.getElementById("stageTitle"),stagePrompt=document.getElementById("stagePrompt"),interactive=document.getElementById("interactive"),nextBtn=document.getElementById("nextBtn"),progressBar=document.getElementById("progressBar"),progressText=document.getElementById("progressText");
function render(){
 const s=stages[step]; unlocked=false; nextBtn.disabled=true;
 stageTag.textContent=s.tag; stageTitle.textContent=s.title; stagePrompt.innerHTML=s.prompt;
 interactive.innerHTML='<div class="question">'+s.question+'</div><div class="choices">'+s.choices.map((c,i)=>'<button class="choice" data-i="'+i+'">'+c+'</button>').join('')+'</div><div id="feedback" class="feedback"></div>';
 interactive.querySelectorAll(".choice").forEach(btn=>btn.addEventListener("click",()=>{
   const i=Number(btn.dataset.i); const ok=i===s.correct; btn.classList.add(ok?"correct":"wrong");
   const feedback=document.getElementById("feedback");
   if(ok){feedback.textContent="✓ "+s.explain;feedback.style.color="#128463";unlocked=true;nextBtn.disabled=false}
   else{feedback.textContent="Chưa đúng. Hãy quay lại manh mối và thử lại.";feedback.style.color="#c13a3a"}
 }));
 progressBar.style.width=((step+1)/stages.length*100)+"%"; progressText.textContent=(step+1)+"/"+stages.length;
}
nextBtn.addEventListener("click",()=>{if(!unlocked)return;if(step<stages.length-1){step++;render()}else{nextBtn.textContent="✓ Đã hoàn thành";nextBtn.disabled=true;document.querySelector(".stage-tag").textContent="HOÀN THÀNH"}});
render();
