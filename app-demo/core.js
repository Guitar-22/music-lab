(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.MILCore=api})(typeof window!=='undefined'?window:globalThis,function(){
  const roles=[
    {id:'performer',icon:'♫',name:'ผู้เล่น / นักร้อง',group:'แสดง',blurb:'สื่อสารอารมณ์ผ่านเสียงและการแสดง',skills:['จังหวะ','การฟัง','การซ้อม','รับ feedback'],learn:'เทคนิคเครื่องหรือเสียง การฟัง การตีความ และการแสดง'},
    {id:'producer',icon:'◉',name:'โปรดิวเซอร์',group:'สร้าง',blurb:'เลือกเสียง วางขั้นตอนบันทึก และแก้เพลง',skills:['การฟัง','จัดไฟล์','แก้ปัญหา','ร่วมงาน'],learn:'การบันทึกเสียง editing mixing และการนำไอเดียสู่ชิ้นงาน'},
    {id:'organizer',icon:'✳',name:'ผู้จัดงาน',group:'เบื้องหลัง',blurb:'ทำให้คน เวลา สถานที่ และเวทีทำงานร่วมกัน',skills:['วางแผน','สื่อสาร','จัดงบ','แก้เหตุฉุกเฉิน'],learn:'run of show เวที เสียงสด งบ และการดูแลผู้ชม'},
    {id:'songwriter',icon:'✎',name:'นักแต่งเพลง',group:'สร้าง',blurb:'สร้างทำนอง เนื้อร้อง และโครงเรื่อง',skills:['ไอเดีย','ทำนอง','ภาษา','แก้งาน'],learn:'songwriting เรียบเรียง และการทำงานกับศิลปิน'},
    {id:'teacher',icon:'☷',name:'ครูดนตรี',group:'สอน',blurb:'ช่วยคนหลายระดับเรียนรู้และเติบโต',skills:['สื่อสาร','ออกแบบบทเรียน','ฟังผู้เรียน','ประเมิน'],learn:'วิธีสอน การออกแบบกิจกรรม และการให้ feedback'},
    {id:'instrument',icon:'♧',name:'ร้าน / ช่างเครื่องดนตรี',group:'บริการ',blurb:'ทำให้คนเข้าถึงเครื่องที่เหมาะและดูแลได้',skills:['รู้จักเครื่อง','ตรวจสภาพ','คิดต้นทุน','บริการ'],learn:'เครื่องดนตรี การบำรุงรักษา การยืม/เช่า และการบริการ'}
  ];
  const missions={
    performer:{title:'ซ้อมเพื่อขึ้นเวที',time:15,brief:'วงของคุณมีสมาชิกที่บ้านไม่มีเครื่องดนตรี และมีเวลาซ้อมร่วมกันเพียง 30 นาที จะเตรียมเพลง 8 ห้องให้พร้อมอย่างไร?',questions:[
      {text:'ก่อนซ้อมรวม คุณจะให้สมาชิกเตรียมตัวอย่างไร?',options:[{text:'ส่งคลิป/จังหวะสั้นให้ร้องหรือเคาะตอบได้',points:2,feedback:'ลดข้อจำกัดเรื่องเครื่องและช่วยทุกคนเข้าจังหวะก่อนเจอ'}, {text:'ให้ทุกคนซื้อเครื่องก่อน',points:0,feedback:'ต้นทุนอาจกันสมาชิกบางคนออก'}, {text:'รอซ้อมรวมครั้งเดียว',points:1,feedback:'เริ่มได้ แต่เวลาแก้จุดไม่ตรงจะน้อย'}]},
      {text:'ระหว่างซ้อม คนหนึ่งเล่นไม่ตรงจังหวะ คุณทำอย่างไร?',options:[{text:'ลดความเร็ว ฟังทีละช่วง แล้วให้ feedback ที่ทำตามได้',points:2,feedback:'ได้ทั้งการแก้ทักษะและความมั่นใจ'}, {text:'หยุดให้คนนั้นเล่น',points:0,feedback:'งานอาจเดินเร็ว แต่คนหนึ่งเสียโอกาสเรียน'}, {text:'เล่นต่อโดยไม่พูดถึง',points:1,feedback:'บรรยากาศไม่สะดุด แต่ปัญหายังอยู่'}]}
    ],artifact:'แผนซ้อม: เตรียมจังหวะล่วงหน้า → ซ้อมช้าเป็นช่วง → รับ feedback และเล่นใหม่'},
    producer:{title:'อัดเสียงด้วยของที่มี',time:15,brief:'เพื่อนส่งเพลงสั้นมาให้คุณทำเดโม มีมือถือหนึ่งเครื่อง ห้องมีเสียงพัดลม และมีเวลาอัด 20 นาที',questions:[
      {text:'คุณเริ่มจากอะไร?',options:[{text:'ทดลองอัด 10 วินาที ปิดแหล่งเสียงรบกวน แล้วฟังกลับ',points:2,feedback:'ทดสอบก่อนช่วยใช้เวลาและอุปกรณ์ที่มีได้คุ้ม'}, {text:'อัดทั้งเพลงทันทีโดยไม่ฟังกลับ',points:1,feedback:'ได้เริ่มเร็ว แต่เสี่ยงพบปัญหาหลังหมดเวลา'}, {text:'ยกเลิกเพราะไม่มีสตูดิโอ',points:0,feedback:'เดโมเบื้องต้นยังทำได้ด้วยมือถือ'}]},
      {text:'เพื่อนอยากแก้ท่อนร้อง คุณจัดงานอย่างไร?',options:[{text:'เก็บไฟล์ต้นฉบับ แยกเวอร์ชัน และจดคำขอแก้',points:2,feedback:'ทีมย้อนกลับได้และไม่ทำงานหาย'}, {text:'ทับไฟล์เดิมทันที',points:0,feedback:'เสียงเก่าอาจหายและเปรียบเทียบไม่ได้'}, {text:'บอกว่าทำไม่ได้',points:1,feedback:'ลดงาน แต่ไม่แก้โจทย์ของศิลปิน'}]}
    ],artifact:'Session plan: ทดสอบเสียง → อัด take → ฟังกลับ → เก็บต้นฉบับและเวอร์ชันแก้'},
    organizer:{title:'เวทีชุมชน 20 นาที',time:15,brief:'คุณจัดเวทีให้ 3 วง รวมเวลาทั้งหมด 20 นาที สมาชิกวงหนึ่งเดินทางไกล และผู้ชมบางคนต้องการทางเข้าที่สะดวก',questions:[
      {text:'คุณจัดตารางอย่างไร?',options:[{text:'เผื่อเวลาขึ้นลงเวทีและยืนยันเวลาถึงของทุกวง',points:2,feedback:'ลดความเสี่ยงที่ตารางล่มและไม่โยนภาระให้วง'}, {text:'ให้แต่ละวงเล่น 7 นาทีโดยไม่มีเวลาขึ้นลง',points:0,feedback:'รวมเกินเวลาและไม่มี buffer'}, {text:'ให้วงที่มาไกลเล่นท้ายสุดโดยไม่ถาม',points:1,feedback:'อาจช่วยหรือเพิ่มภาระเดินทาง ควรถามก่อน'}]},
      {text:'ทางเข้าหลักมีบันได คุณตัดสินใจอย่างไร?',options:[{text:'ตรวจทางเข้าทางเลือกกับสถานที่และแจ้งผู้เข้าร่วมล่วงหน้า',points:2,feedback:'ผู้ร่วมงานวางแผนได้และทีมแก้ปัญหาก่อนวันจริง'}, {text:'รอดูเมื่อมีคนขอ',points:1,feedback:'อาจช่วยได้ช้า'}, {text:'ไม่แจ้งเพราะคิดว่าคงไม่มีปัญหา',points:0,feedback:'ข้อมูลไม่ครบอาจกันคนออกจากงาน'}]}
    ],artifact:'Run sheet: ยืนยันการเดินทาง → เผื่อ changeover → ตรวจทางเข้า → แจ้งข้อมูลผู้ร่วมงาน'}
  };
  const providers=[
    {id:'a',name:'ครูตัวอย่าง A',kind:'ครูอิสระ',role:'performer',mode:'onsite',area:'เมือง',price:520,extras:200,travel:80,loan:true,level:'เริ่มต้น',method:'ลองเล่นและฟังกลับทุกคาบ',verified:false},
    {id:'b',name:'ครูตัวอย่าง B',kind:'ครูอิสระ',role:'producer',mode:'online',area:'ออนไลน์',price:420,extras:0,travel:0,loan:false,level:'เริ่มต้น',method:'ทำเดโมจากมือถือและรับ feedback',verified:false},
    {id:'c',name:'ศูนย์ดนตรีตัวอย่าง C',kind:'กลุ่ม/ชุมชน',role:'performer',mode:'onsite',area:'นอกเมือง',price:250,extras:100,travel:120,loan:true,level:'เริ่มต้น',method:'ฝึกเป็นกลุ่มและมีเครื่องยืม',verified:false},
    {id:'d',name:'พี่เลี้ยงตัวอย่าง D',kind:'เวิร์กช็อป',role:'organizer',mode:'online',area:'ออนไลน์',price:300,extras:0,travel:0,loan:false,level:'ทุกระดับ',method:'ทำ run sheet กับผู้จัดงาน',verified:false}
  ];
  const opportunities=[
    {id:'o1',title:'วงทดลองสำหรับผู้เริ่มต้น',type:'วงชุมชน',place:'พื้นที่สมมติ',cost:'ฟรี',detail:'ลองซ้อมร่วมกันหนึ่งครั้ง มีหน้าที่ให้ทุกระดับ'},
    {id:'o2',title:'ช่วยทีมงานเวทีเล็ก',type:'งานเบื้องหลัง',place:'พื้นที่สมมติ',cost:'ฟรี',detail:'ลองจัด run sheet และดูการเปลี่ยนวง'},
    {id:'o3',title:'ฟังเดโมและให้ feedback',type:'กลุ่มสร้างเพลง',place:'ออนไลน์สมมติ',cost:'ฟรี',detail:'กลุ่มเล็กมีกติกาการให้ความเห็นที่เคารพกัน'}
  ];
  const weeks=[
    ['1','ลองหนึ่งบทบาท','ทำภารกิจแรกและบันทึกสิ่งที่สนุก'],['2','ลองอีกบทบาท','เทียบงานหน้าเวทีกับหลังเวที'],['3','เลือกทักษะหนึ่งเรื่อง','ฝึกจังหวะ การฟัง หรือการวางแผน'],['4','ดูคนสอน/ที่เรียน','เทียบต้นทุนและวิธี feedback'],['5','ทำชิ้นงานร่าง','ทำเดโมหรือแผนหนึ่งหน้า'],['6','รับคำแนะนำ','ให้ครูหรือเพื่อนตอบกลับ'],['7','แก้ชิ้นงาน','อธิบายเหตุผลที่เปลี่ยน'],['8','เลือกก้าวถัดไป','เรียนต่อ เข้าวง เปลี่ยนสาย หรือพัก']
  ];
  function missionScore(missionId,answers){const m=missions[missionId];if(!m||!Array.isArray(answers))return 0;return m.questions.reduce((sum,q,i)=>sum+(q.options[answers[i]]?.points||0),0)}
  function monthlyTotal(provider){return provider.price*4+provider.extras+provider.travel*4}
  function matchProviders(filters={}){return providers.filter(p=>(!filters.role||p.role===filters.role)&&(!filters.mode||filters.mode==='any'||p.mode===filters.mode)&&(!filters.needLoan||p.loan)).map(p=>{const total=monthlyTotal(p);let score=0;const reasons=[];if(filters.role){score+=3;reasons.push('ตรงสายที่สนใจ')}if(filters.mode&&filters.mode!=='any'){score+=2;reasons.push('ตรงรูปแบบเรียน')}if(filters.needLoan){score+=2;reasons.push('มีเครื่องให้ลอง/ยืม')}if(!filters.budget||total<=Number(filters.budget)){score+=2;reasons.push('อยู่ในงบตัวอย่าง')}return {...p,total,score,reasons,overBudget:!!filters.budget&&total>Number(filters.budget)}}).sort((a,b)=>b.score-a.score||a.total-b.total)}
  return {roles,missions,providers,opportunities,weeks,missionScore,monthlyTotal,matchProviders}
});
