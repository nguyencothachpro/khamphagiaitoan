const SCHEMA={type:"object",additionalProperties:false,properties:{
title:{type:"string"},summary:{type:"string"},
student:{type:"object",additionalProperties:false,properties:{grade:{type:"string"},topic:{type:"string"},task:{type:"string"}},required:["grade","topic","task"]},
teacher:{type:"object",additionalProperties:false,properties:{lesson_goal:{type:"string"},mystery:{type:"string"},clue_strategy:{type:"string"}},required:["lesson_goal","mystery","clue_strategy"]},
mystery:{type:"object",additionalProperties:false,properties:{title:{type:"string"},context:{type:"string"}},required:["title","context"]},
clues:{type:"array",items:{type:"object",additionalProperties:false,properties:{title:{type:"string"},content:{type:"string"}},required:["title","content"]}},
exploration:{type:"object",additionalProperties:false,properties:{guiding_questions:{type:"array",items:{type:"string"}}},required:["guiding_questions"]},
standardization:{type:"object",additionalProperties:false,properties:{concept:{type:"string"},knowledge:{type:"string"}},required:["concept","knowledge"]},
solution:{type:"object",additionalProperties:false,properties:{title:{type:"string"},steps:{type:"array",items:{type:"string"}}},required:["title","steps"]},
practice:{type:"array",minItems:5,maxItems:5,items:{type:"object",additionalProperties:false,properties:{level:{type:"string"},problem:{type:"string"},guidance:{type:"string"},solution:{type:"string"},common_error:{type:"string"}},required:["level","problem","guidance","solution","common_error"]}},
application:{type:"object",additionalProperties:false,properties:{title:{type:"string"},task:{type:"string"}},required:["title","task"]}
},required:["title","summary","student","teacher","mystery","clues","exploration","standardization","solution","practice","application"]};

const SYSTEM=`Bạn là bộ máy thiết kế HÀNH TRÌNH KHÁM PHÁ TOÁN cho giáo viên Toán THCS Việt Nam.
Không coi yêu cầu này là một cuộc trò chuyện hỏi-đáp thông thường. Nhiệm vụ là biến bài toán/dữ kiện đầu vào thành một cấu trúc dạy học có thể hiển thị thành hành trình.

Nguyên tắc cốt lõi:
- Bí ẩn chỉ tạo động lực/bối cảnh; không kể chuyện thay cho tư duy toán học.
- Manh mối phải là dữ kiện, biểu thức, quan hệ hoặc quan sát toán học thật.
- Khám phá theo mạch: Quan sát → dự đoán → tìm manh mối → thử → phát hiện quan hệ → giải thích → hình thành kiến thức.
- Vùng khó phải được bẻ thành các câu hỏi nhỏ; không nhảy cóc.
- Cuối hoạt động phải quay về kiến thức Toán chuẩn: kiến thức chốt, cách trình bày, năng lực/kĩ năng.
- Luyện tập phải gồm đúng 5 bài: củng cố trực tiếp; biến đổi nhẹ; vận dụng; lỗi dễ mắc/kiểm tra khái niệm; tổng hợp.
- Mỗi bài luyện tập phải có gợi dẫn, lời giải và lỗi thường gặp.
- Nếu dữ kiện đầu vào không đủ để xác định lớp/chủ đề, ghi rõ chưa xác định thay vì bịa.
- Nếu ảnh/tệp không đọc rõ, nêu phần chưa đọc được.
- Không biến kết quả thành lời quảng cáo, không thêm module LMS.

Phong cách: rõ ràng, sư phạm, bắt đầu từ điều nhỏ nhất; luôn trả lời câu hỏi “vì sao làm bước này?”.`;

export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 try{
  const {provider="openai",prompt="",files=[],apiKey=""}=req.body||{};
  if(!prompt&&!files.length)return res.status(400).json({error:"Chưa có bài toán."});
  const inputText=prompt||"Hãy đọc đề bài từ tệp đính kèm và xây Hành Trình Khám Phá Toán.";
  let journey;
  if(provider==="gemini") journey=await gemini(inputText,files,apiKey); else journey=await openai(inputText,files,apiKey);
  return res.status(200).json({journey});
 }catch(e){console.error(e);return res.status(500).json({error:e.message||"Lỗi máy chủ."})}
}

async function openai(text,files,apiKey){
 const key=apiKey||process.env.OPENAI_API_KEY;
 if(!key)throw new Error("Chưa có OpenAI API key. Hãy nhập key ở nút 🔑 API key.");
 const content=[{type:"input_text",text}];
 for(const f of files){if(f.type.startsWith("image/"))content.push({type:"input_image",image_url:f.data});else if(f.type==="application/pdf")content.push({type:"input_file",filename:f.name,file_data:f.data});}
 const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({
  model:process.env.OPENAI_MODEL||"gpt-5.6-luna",instructions:SYSTEM,input:[{role:"user",content}],
  text:{format:{type:"json_schema",name:"math_journey",strict:true,schema:SCHEMA}}
 })});
 const d=await r.json();if(!r.ok)throw new Error(d.error?.message||"OpenAI API lỗi");
 const out=d.output?.flatMap(x=>x.content||[]).find(x=>x.type==="output_text")?.text;if(!out)throw new Error("OpenAI không trả về cấu trúc.");
 return JSON.parse(out);
}
async function gemini(text,files,apiKey){
 const key=apiKey||process.env.GEMINI_API_KEY;
 if(!key)throw new Error("Chưa có Gemini API key. Hãy nhập key ở nút 🔑 API key.");
 const parts=[{text}];
 for(const f of files){if(f.type.startsWith("image/")||f.type==="application/pdf")parts.push({inline_data:{mime_type:f.type,data:f.data.split(",")[1]}});}
 const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+(process.env.GEMINI_MODEL||"gemini-3.8-flash")+":generateContent?key="+encodeURIComponent(key),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{role:"user",parts}],systemInstruction:{parts:[{text:SYSTEM}]},generationConfig:{response_mime_type:"application/json",response_schema:SCHEMA}})});
 const d=await r.json();if(!r.ok)throw new Error(d.error?.message||"Gemini API lỗi");
 const out=d.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("");if(!out)throw new Error("Gemini không trả về cấu trúc.");return JSON.parse(out);
}