const SCHEMA={type:"object",additionalProperties:false,properties:{
title:{type:"string"},summary:{type:"string"},content_type:{type:"string",enum:["problem","theory","mixed"]},
student:{type:"object",additionalProperties:false,properties:{grade:{type:"string"},topic:{type:"string"},task:{type:"string"}},required:["grade","topic","task"]},
teacher:{type:"object",additionalProperties:false,properties:{lesson_goal:{type:"string"},mystery:{type:"string"},clue_strategy:{type:"string"}},required:["lesson_goal","mystery","clue_strategy"]},
mystery:{type:"object",additionalProperties:false,properties:{title:{type:"string"},context:{type:"string"}},required:["title","context"]},
problem_maps:{type:"array",minItems:0,maxItems:5,items:{type:"object",additionalProperties:false,properties:{method_title:{type:"string"},method_note:{type:"string"},root:{type:"string"},branches:{type:"array",minItems:1,maxItems:6,items:{type:"object",additionalProperties:false,properties:{label:{type:"string"},expression:{type:"string"},reason:{type:"string"}},required:["label","expression","reason"]}},conclusion_label:{type:"string"},conclusion_value:{type:"string"},explanation:{type:"string"}},required:["method_title","method_note","root","branches","conclusion_label","conclusion_value","explanation"]}},map_discovery_steps:{type:"array",minItems:0,maxItems:10,items:{type:"object",additionalProperties:false,properties:{map_index:{type:"integer"},step_title:{type:"string"},teacher_question:{type:"string"},student_goal:{type:"string"},expected_answer:{type:"string"},unlock:{type:"string"},hint:{type:"string"},if_wrong:{type:"string"}},required:["map_index","step_title","teacher_question","student_goal","expected_answer","unlock","hint","if_wrong"]}},concept_maps:{type:"array",minItems:0,maxItems:5,items:{type:"object",additionalProperties:false,properties:{method_title:{type:"string"},method_note:{type:"string"},root:{type:"string"},branches:{type:"array",minItems:1,maxItems:8,items:{type:"object",additionalProperties:false,properties:{label:{type:"string"},expression:{type:"string"},reason:{type:"string"}},required:["label","expression","reason"]}},conclusion_label:{type:"string"},conclusion_value:{type:"string"},explanation:{type:"string"}},required:["method_title","method_note","root","branches","conclusion_label","conclusion_value","explanation"]}},concept_map_steps:{type:"array",minItems:0,maxItems:12,items:{type:"object",additionalProperties:false,properties:{map_index:{type:"integer"},step_title:{type:"string"},teacher_question:{type:"string"},student_goal:{type:"string"},expected_answer:{type:"string"},unlock:{type:"string"},hint:{type:"string"},if_wrong:{type:"string"}},required:["map_index","step_title","teacher_question","student_goal","expected_answer","unlock","hint","if_wrong"]}},
evidence:{type:"array",minItems:0,maxItems:6,items:{type:"object",additionalProperties:false,properties:{label:{type:"string"},quote:{type:"string"},why_notice:{type:"string"},question:{type:"string"}},required:["label","quote","why_notice","question"]}},
clues:{type:"array",minItems:0,maxItems:6,items:{type:"object",additionalProperties:false,properties:{title:{type:"string"},from_evidence:{type:"array",items:{type:"string"}},discovery_goal:{type:"string"},guiding_questions:{type:"array",minItems:2,maxItems:4,items:{type:"string"}},expected_discovery:{type:"string"},hint:{type:"string"}},required:["title","from_evidence","discovery_goal","guiding_questions","expected_discovery","hint"]}},
discoveries:{type:"array",minItems:0,maxItems:8,items:{type:"object",additionalProperties:false,properties:{title:{type:"string"},content:{type:"string"},from_clues:{type:"array",items:{type:"string"}},why_it_matters:{type:"string"}},required:["title","content","from_clues","why_it_matters"]}},
connections:{type:"array",minItems:0,maxItems:6,items:{type:"object",additionalProperties:false,properties:{from:{type:"string"},to:{type:"string"},reason:{type:"string"}},required:["from","to","reason"]}},
synthesis:{type:"object",additionalProperties:false,properties:{title:{type:"string"},chain:{type:"string"},reveal:{type:"string"}},required:["title","chain","reveal"]},
standardization:{type:"object",additionalProperties:false,properties:{concept:{type:"string"},knowledge:{type:"string"}},required:["concept","knowledge"]},
solution:{type:"object",additionalProperties:false,properties:{synthesis:{type:"string"},title:{type:"string"},steps:{type:"array",items:{type:"object",additionalProperties:false,properties:{label:{type:"string"},content:{type:"string"},why:{type:"string"}},required:["label","content","why"]}},final_answer:{type:"string"}},required:["synthesis","title","steps","final_answer"]},
practice:{type:"array",minItems:5,maxItems:5,items:{type:"object",additionalProperties:false,properties:{level:{type:"string"},problem:{type:"string"},guidance:{type:"string"},solution:{type:"string"},common_error:{type:"string"}},required:["level","problem","guidance","solution","common_error"]}},
application:{type:"object",additionalProperties:false,properties:{title:{type:"string"},task:{type:"string"}},required:["title","task"]}
},required:["title","summary","content_type","student","teacher","mystery","problem_maps","map_discovery_steps","concept_maps","concept_map_steps","evidence","clues","discoveries","connections","synthesis","standardization","solution","practice","application"]};

const SYSTEM=`Bạn là bộ máy GIẢI PHẪU VÀ KHÁM PHÁ BÍ ẨN CỦA MỘT BÀI TOÁN THCS Việt Nam.

Mục tiêu không phải chia lời giải thành các thẻ. Mục tiêu là mô phỏng quá trình một học sinh nhìn vào một bài toán, phát hiện dấu vết, lần theo dấu vết để tìm manh mối, khám phá từng manh mối, rồi kết nối các phát hiện để tự nhìn thấy cách giải.

BỐN TẦNG BẮT BUỘC:
1. TÌM DẤU VẾT: evidence là những chi tiết THỰC SỰ CÓ TRONG đề bài. Không được biến chúng thành đáp án. Mỗi dấu vết phải có quote/chi tiết, lý do đáng chú ý và một câu hỏi quan sát.
2. LẦN THEO DẤU VẾT → MANH MỐI: mỗi clue phải ghi rõ nó xuất phát từ evidence nào. Manh mối là điều học sinh có thể lần ra từ dấu vết, chưa phải lời giải cuối.
3. KHÁM PHÁ: mỗi clue có mục tiêu phát hiện, 2–4 câu hỏi đi từ quan sát đến suy luận, một đáp án/phát hiện mong đợi và gợi ý khi bí. Câu hỏi phải bám vào clue và KHÔNG nói sẵn expected_discovery.
4. KẾT NỐI: connections phải chỉ rõ phát hiện nào kết nối với phát hiện nào và vì sao. Cuối cùng synthesis phải làm học sinh thấy cách giải lóe ra từ chính các kết nối.

SƠ ĐỒ GIẢI PHẪU NGẮN Ở ĐẦU BÀI:
- Tạo thêm problem_maps ngay sau phần bí ẩn. Đây là các bản đồ cực ngắn để học sinh nhìn thấy cấu trúc bài toán trước khi đi vào điều tra chi tiết.
- Mỗi phần tử problem_maps tương ứng với MỘT CÁCH GIẢI KHÁC NHAU nhưng hợp lệ và có ý nghĩa sư phạm; không tạo nhiều sơ đồ nếu các cách thực chất giống nhau. method_title nêu tên cách giải, method_note nói ngắn gọn điểm khác biệt của cách đó. root là ĐỐI TƯỢNG GỐC mà học sinh nhìn thấy đầu tiên trong đề (thường là tổng số ngày, tổng quãng đường, tổng số sản phẩm, hình ban đầu...), branches là các phần được tách ra từ root theo đúng câu chữ của đề, là các phần tách ra từ root theo đúng quan hệ trong đề; expression là biểu diễn ngắn gọn (ví dụ “3x”, “7(x+5)”). reason là diễn giải bằng lời cho HỌC SINH: vì sao từ dữ kiện vừa quan sát lại đi đến biểu diễn này, và mảnh này có ý nghĩa gì trong toàn bộ bài toán. Không dùng reason để nói luôn bước giải tiếp theo.
- conclusion_label và conclusion_value là điểm hội tụ của các nhánh (ví dụ “TỔNG SẢN LƯỢNG” và “335”).
- explanation giải thích bằng lời vì sao sơ đồ này được lập như vậy, không giải bài và không bỏ qua phần khám phá.
- Mỗi sơ đồ phải ngắn, dễ nhìn và ĐỌC TỪ TRÊN XUỐNG: root ở trên cùng → các nhánh ở giữa → biểu diễn của từng nhánh → điểm hội tụ ở dưới cùng. Ví dụ nếu đề nói “10 ngày gồm 3 ngày đầu và 7 ngày tiếp theo”, sơ đồ phải có “10 NGÀY” ở trên, tách thành “3 ngày” và “7 ngày”, dưới mỗi nhánh mới ghi “3x” và “7(x+5)”, rồi hai nhánh hội tụ vào “TỔNG SẢN LƯỢNG → 335”. Sơ đồ chỉ mô tả cấu trúc và quan hệ dữ kiện, KHÔNG biến thành sơ đồ biến đổi phương trình và KHÔNG tự đưa phép tính trung gian như “10x + 35 = 335” vào sơ đồ. Nếu bài toán chỉ có một cách giải tự nhiên thì chỉ tạo một sơ đồ. Nếu có từ hai cách giải thực sự khác nhau thì tạo các sơ đồ tương ứng và chú giải riêng cho từng sơ đồ. Không ép tạo nhiều cách giải.

CƠ CHẾ GIÁO VIÊN DẪN HỌC SINH TỰ DỰNG SƠ ĐỒ:
- Tạo map_discovery_steps để biến problem_maps từ “sơ đồ đáp án” thành “sơ đồ được học sinh tự khám phá”.
- Mỗi bước là một câu hỏi dẫn dắt của giáo viên. Không nói ngay mảnh sơ đồ cần xuất hiện.
- student_goal mô tả học sinh cần nhận ra điều gì; expected_answer chỉ dành cho hệ thống/giáo viên, KHÔNG coi đó là lời thoại dẫn sẵn cho học sinh.
- unlock là MẢNH SƠ ĐỒ sẽ xuất hiện sau khi học sinh trả lời đúng, ví dụ “10 NGÀY”, “3 ngày”, “7 ngày”, “3x”, “7(x+5)”, “TỔNG SẢN LƯỢNG → 335”.
- hint là gợi ý nhẹ khi học sinh bí; if_wrong là cách giáo viên hỏi lại để học sinh quay về dữ kiện, không nói đáp án ngay.
- map_index phải chỉ đúng problem_maps[index] mà bước đó đang xây dựng (đánh số từ 0).
- Trình tự phải đi từ cấu trúc đề → chia thành các phần → biểu diễn từng phần → mối quan hệ cuối cùng. Mỗi bước chỉ mở một mảnh hoặc một quan hệ nhỏ.
- Không đưa phương trình hoàn chỉnh ngay trong các bước xây sơ đồ. Phương trình chỉ xuất hiện sau khi sơ đồ hoàn chỉnh và học sinh được hỏi về quan hệ giữa các nhánh.

XỬ LÝ LÝ THUYẾT / KIẾN THỨC:
- Nếu đầu vào là một đoạn lý thuyết, định nghĩa, tính chất, quy tắc, phương pháp hoặc ghi chú bài học thay vì một bài toán cụ thể, content_type phải là "theory". Nếu vừa có lý thuyết vừa có bài toán thì "mixed".
- Với "theory", không ép biến nội dung thành bài giải. Hãy tìm CẤU TRÚC BẢN CHẤT của kiến thức: khái niệm gốc → đặc điểm/quan hệ → hệ quả → cách nhận biết → cách dùng. Chỉ đưa những quan hệ thực sự được hỗ trợ bởi nội dung người dùng đưa vào.
- Tạo concept_maps để biểu diễn kiến thức bằng sơ đồ từ trên xuống. root là ý tưởng/khái niệm mà học sinh cần nắm đầu tiên; branches là các thành phần, dấu hiệu, quan hệ hoặc trường hợp phát triển từ root; expression là từ khóa/công thức ngắn; reason là diễn giải ngắn gọn giúp học sinh hiểu vì sao nhánh đó xuất hiện và nó có ý nghĩa gì; conclusion_label/value là điều học sinh có thể kết luận sau khi nối các nhánh.
- Tạo concept_map_steps theo đúng tinh thần khám phá: giáo viên hỏi một câu nhỏ → học sinh dự kiến nhận ra một ý → mở đúng một mảnh sơ đồ → đi tiếp. Không đưa toàn bộ sơ đồ ngay từ đầu và không bắt giáo viên nhập câu trả lời.
- Nếu lý thuyết có ví dụ, dùng ví dụ làm "dấu vết" để học sinh quan sát và tự phát hiện quy luật; không thay ví dụ bằng một ví dụ khác nếu không cần.
- Sau phần khám phá lý thuyết mới chuẩn hóa định nghĩa/tính chất/quy tắc. Mục tiêu là giúp học sinh hiểu BẢN CHẤT, không học thuộc câu chữ trước.

QUY TẮC SƯ PHẠM:
- Không đặt x, không lập phương trình, không đưa công thức giải ngay từ đầu nếu học sinh chưa có đủ lý do để đi đến đó.
- Không nói “manh mối 1 là...” rồi cho luôn kết quả mà câu hỏi đang yêu cầu.
- Mỗi câu hỏi phải trả lời được: “Câu hỏi này giúp học sinh nhìn thấy điều gì tiếp theo?”
- Nếu một bước suy luận khó, bẻ thành các câu hỏi nhỏ.
- Cho phép một dấu vết dẫn tới nhiều manh mối, và nhiều manh mối cùng hội tụ vào một phát hiện.
- Ưu tiên sơ đồ quan hệ: dữ kiện → dấu vết → manh mối → phát hiện → kết nối.
- Bí ẩn là câu hỏi lớn bao trùm bài toán; không kể chuyện dài.
- Sau khi bí ẩn được giải, mới CHUẨN HÓA kiến thức.
- Lời giải cuối phải độc lập với phần khám phá, trình bày chuẩn THCS/Kết nối tri thức: xác định ẩn/điều kiện, biểu diễn, lập quan hệ, giải, kiểm tra, kết luận. Không viết như lời thoại.
- Lời giải phải đủ chi tiết để học sinh có thể học cách trình bày.
- Giao diện hiển thị lời giải trên nền giấy viết tay.
- Đúng 5 bài luyện tập.
- Không bịa dữ kiện. Nếu ảnh/tệp không rõ, nói rõ phần không đọc được.
`;

export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 try{
  const {provider="openai",prompt="",files=[],apiKey=""}=req.body||{};
  if(!prompt&&!files.length)return res.status(400).json({error:"Chưa có bài toán."});
  const inputText=(prompt||"Hãy đọc nội dung từ tệp đính kèm và xây Hành Trình Khám Phá Toán.")+"\n\nHãy tự xác định đây là BÀI TOÁN, LÝ THUYẾT hay KẾT HỢP; nếu là lý thuyết thì phải tạo concept_maps và concept_map_steps.";
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
 const geminiSchema=toGeminiSchema(SCHEMA);
 const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+(process.env.GEMINI_MODEL||"gemini-3.8-flash")+":generateContent?key="+encodeURIComponent(key),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{role:"user",parts}],systemInstruction:{parts:[{text:SYSTEM}]},generationConfig:{response_mime_type:"application/json",response_schema:geminiSchema}})});
 const d=await r.json();if(!r.ok)throw new Error(d.error?.message||"Gemini API lỗi");
 const out=d.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("");if(!out)throw new Error("Gemini không trả về cấu trúc.");return JSON.parse(out);
}

function toGeminiSchema(node){
 if(Array.isArray(node)) return node.map(toGeminiSchema);
 if(!node||typeof node!=="object") return node;
 const out={};
 for(const [k,v] of Object.entries(node)){
   if(k==="additionalProperties") continue;
   out[k]=toGeminiSchema(v);
 }
 return out;
}
