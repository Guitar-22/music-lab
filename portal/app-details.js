(function (root, factory) { const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; root.MILAppDetails = api; })(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  // รายละเอียดเชิงลึกของ 35 แหล่งใน resources.js — ใช้ในหน้า Journey Gate (journey.html)
  //
  // ที่มาของข้อมูลแต่ละช่อง:
  //   about / features / pricing / level  = สรุปโดยทีมจากหน้าเจ้าของและร้านแอป (ภาษาไทย) — ต้องเทียบกับข้อความทางการทุกครั้งที่อัปเดต
  //   officialText / iconUrl / rating ฯลฯ   = ดึงอัตโนมัติด้วย tools/fetch-app-details.cjs → app-store-data.js (ข้อความเจ้าของตามจริง ไม่แปล)
  //   ไอคอน: appStoreId → ไอคอนแอปจาก Apple (artworkUrl512) · appSearch → หาแอปของผลิตภัณฑ์เดียวกันโดยชื่อผู้ขายต้องตรง
//          · ไม่มีแอปใน App Store → ไอคอนเว็บไซต์ของเจ้าของ (site)
  //
  // platforms: iphone ipad android mac windows linux web
  // traits: explorer rhythm melody reader creator producer performer culture pathway  (ใช้จับคู่กับผลสำรวจตัวตน)
  // instruments: ใส่เฉพาะแหล่งที่ทำมาสำหรับเครื่องดนตรีเดียว (ใช้กันไม่ให้แนะนำคอร์สกีตาร์ให้คนเล่นเปียโน)
  // style: play = ลงมือเล่นเลย · structured = บทเรียนทีละขั้น · teacher = มีครู/สถาบัน · selfstudy = แกะเอง/ใช้เป็นเครื่องมือ
  const D = (id, o) => [id, o];
  const details = Object.fromEntries([
    D('chrome-lab', {
      site: 'musiclab.chromeexperiments.com', platforms: ['web'], level: 'เริ่มต้นจากศูนย์',
      traits: ['explorer', 'rhythm', 'melody'], style: ['play'],
      about: 'ชุดการทดลองดนตรีบนเว็บของ Google ที่เปลี่ยนแนวคิดดนตรีเป็นของเล่น เช่น Song Maker (วางโน้ตบนตารางแล้วได้เพลงทันที), Rhythm, Kandinsky (วาดรูปเป็นเสียง), Chords, Arpeggios และ Spectrogram เปิดในเบราว์เซอร์ได้ทันทีโดยไม่ต้องสมัครหรือมีเครื่องดนตรี',
      features: ['Song Maker สร้างทำนองและจังหวะบนตาราง แล้วแชร์เป็นลิงก์', 'Rhythm / Kandinsky ให้ลองจังหวะและเสียงผ่านภาพ', 'Chords, Arpeggios, Harmonics อธิบายทฤษฎีด้วยการฟังจริง', 'Spectrogram / Sound Waves ให้เห็นรูปร่างของเสียง'],
      pricing: 'ฟรีทั้งหมด ไม่มีโฆษณาและไม่ต้องสมัคร', limits: 'เป็นของเล่นทดลอง ไม่มีบทเรียนต่อเนื่องหรือการวัดผล',
    }),
    D('ableton', {
      site: 'learningmusic.ableton.com', platforms: ['web'], level: 'เริ่มต้นจากศูนย์',
      traits: ['explorer', 'creator', 'producer', 'rhythm'], style: ['structured', 'play'],
      about: 'บทเรียนโต้ตอบบนเว็บจาก Ableton ที่สอนพื้นฐานการสร้างเพลงแบบอิเล็กทรอนิกส์: จังหวะกลอง เบสไลน์ คอร์ด ทำนอง และโครงสร้างเพลง ผู้เรียนกดเล่นและแก้ลูปในหน้าเว็บได้ทันที และมีบทต่อยอด Learning Synths สำหรับการออกแบบเสียง',
      features: ['บท Beats, Notes & Scales, Chords, Basslines, Melodies, Song structure', 'ทุกบทมีตาราง/ซีเควนเซอร์ให้ลองแก้แล้วฟังผลทันที', 'ส่งออกไอเดียไปเปิดต่อใน Ableton Live ได้', 'ต่อด้วย Learning Synths เพื่อเข้าใจซินธิไซเซอร์'],
      pricing: 'ฟรี', limits: 'เน้นเพลงอิเล็กทรอนิกส์/ป๊อป ไม่สอนการเล่นเครื่องดนตรี',
    }),
    D('theory-lessons', {
      site: 'www.musictheory.net', platforms: ['web'], level: 'เริ่มต้น–กลาง',
      traits: ['reader', 'melody'], style: ['structured'],
      about: 'บทเรียนทฤษฎีดนตรีเรียงเป็นชุดตั้งแต่บรรทัดห้าเส้น กุญแจ ค่าโน้ต จังหวะ ไปจนถึงบันไดเสียง ขั้นคู่ คอร์ด และการเคลื่อนคอร์ด แต่ละบทเป็นสไลด์สั้นพร้อมภาพโน้ตและเสียง เป็นแหล่งที่ครูดนตรีหลายแห่งใช้ประกอบการสอน',
      features: ['หมวด The Basics, Rhythm & Meter, Scales & Key Signatures, Intervals, Chords, Diatonic Chords', 'บทสั้นทีละแนวคิด เปิดบนมือถือได้', 'จับคู่กับหน้า Exercises เพื่อฝึกทันที', 'มีแอป Theory Lessons/Tenuto สำหรับ iOS'],
      pricing: 'บทเรียนบนเว็บฟรี', limits: 'ภาษาอังกฤษ ไม่มีครูตอบคำถาม',
    }),
    D('theory-exercises', {
      site: 'www.musictheory.net', platforms: ['web'], level: 'เริ่มต้น–กลาง',
      traits: ['reader', 'melody'], style: ['structured', 'selfstudy'],
      about: 'แบบฝึกหัดทฤษฎีและโสตทักษะที่ตั้งค่าได้ เช่น ทายชื่อโน้ต ทายตัวโน้ตบนคีย์บอร์ด/เฟรตกีตาร์ ทายขั้นคู่ คอร์ด และฝึกฟัง ผู้เรียนเลือกขอบเขตโจทย์เองและสร้างลิงก์แบบฝึกหัดเฉพาะให้นักเรียนได้',
      features: ['Note / Key / Interval / Chord Identification', 'Ear Training: ฟังขั้นคู่ คอร์ด บันไดเสียง', 'ตั้งค่าโจทย์และบันทึกเป็นลิงก์ได้', 'นับคะแนนและความแม่นยำในแต่ละรอบ'],
      pricing: 'ฟรีบนเว็บ', limits: 'ไม่มีบทอธิบายในหน้าแบบฝึก — ใช้คู่กับ Lessons',
    }),
    D('bandlab', {
      appSearch: { term: 'BandLab', seller: 'BandLab' }, site: 'www.bandlab.com', platforms: ['web', 'iphone', 'ipad', 'android'], level: 'เริ่มต้น–กลาง',
      traits: ['creator', 'producer', 'explorer'], style: ['play', 'selfstudy'],
      about: 'สตูดิโอทำเพลงออนไลน์และชุมชนนักดนตรีจาก BandLab ใช้อัดเสียง ทำบีต ใส่ลูปและเอฟเฟกต์ได้ทั้งบนเว็บและมือถือ งานเก็บบนคลาวด์ ทำให้ชวนเพื่อนมาช่วยแต่งเพลงร่วมกันและเผยแพร่ในชุมชนได้',
      features: ['Studio แบบหลายแทร็ก อัดเสียงร้อง/กีตาร์ผ่านมือถือได้', 'ลูปและซาวด์แพ็กจำนวนมาก, เครื่องทำบีต', 'ทำงานร่วมกันแบบเรียลไทม์และเก็บเวอร์ชันบนคลาวด์', 'ชุมชนสำหรับแชร์เพลงและรับฟีดแบ็ก'],
      pricing: 'สตูดิโอหลักใช้ฟรี (มีบริการเสริมแบบจ่ายเงิน)', limits: 'ต้องสมัครบัญชีและต่ออินเทอร์เน็ต; งานระดับมิกซ์ละเอียดยังสู้ DAW บนคอมไม่ได้',
    }),
    D('musescore', {
      appSearch: { term: 'MuseScore', seller: 'Muse' }, site: 'musescore.org', platforms: ['windows', 'mac', 'linux'], level: 'เริ่มต้น–กลาง',
      traits: ['reader', 'creator', 'melody'], style: ['selfstudy'],
      about: 'โปรแกรมเขียนโน้ตแบบโอเพนซอร์สสำหรับคอมพิวเตอร์ ใช้เขียนโน้ตเพลง แท็บกีตาร์ และพาร์ตวง เล่นเสียงตัวอย่างด้วย Muse Sounds และพิมพ์หรือส่งออกเป็น PDF, MusicXML, MIDI, เสียงได้',
      features: ['เขียนโน้ตเต็มวง, แท็บ, คอร์ดกีตาร์, เนื้อร้อง', 'เล่นเสียงตัวอย่างสมจริงด้วยไลบรารี Muse Sounds (ฟรี)', 'แยกพาร์ตให้ผู้เล่นแต่ละคนอัตโนมัติ', 'นำเข้า/ส่งออก MusicXML, MIDI, PDF'],
      pricing: 'ฟรีและโอเพนซอร์ส', limits: 'ต้องติดตั้งบนคอม; มีเส้นโค้งการเรียนรู้เรื่องคีย์ลัด',
    }),
    D('musora', {
      instruments: ['guitar'], appSearch: { term: 'Musora', seller: 'Musora' }, site: 'www.musora.com', platforms: ['web', 'iphone', 'ipad', 'android'], level: 'เริ่มต้น–ขั้นสูง',
      traits: ['performer', 'rhythm', 'melody'], style: ['structured', 'teacher'],
      about: 'แพลตฟอร์มคอร์สวิดีโอดนตรีที่รวมแบรนด์ Guitareo (กีตาร์), Drumeo (กลอง), Pianote (เปียโน) และ Singeo (ร้อง) มีเส้นทางเรียนเป็นระดับ เพลงประกอบ และไลฟ์กับครู',
      features: ['หลักสูตรเป็นลำดับ (Method) ตั้งแต่เริ่มจับเครื่อง', 'บทเรียนเพลงพร้อมโน้ต/แท็บ และ play-along', 'ไลฟ์และชุมชนผู้เรียน', 'ใช้ได้ทั้งเว็บและแอปมือถือ'],
      pricing: 'สมาชิกแบบเสียเงิน (มีช่วงทดลอง) — ตรวจราคาปัจจุบันที่เว็บ', limits: 'ภาษาอังกฤษทั้งหมด ต้องมีเครื่องดนตรี',
    }),
    D('samt', {
      site: 'www.mysamt.com', platforms: ['web'], level: 'ทุกระดับ',
      traits: ['pathway', 'performer'], style: ['teacher'],
      about: 'เว็บไซต์ SAMT Music สำหรับค้นหาครูดนตรีในประเทศไทยตามเครื่องดนตรีและพื้นที่ พร้อมข้อมูลกิจกรรมดนตรีของเครือข่าย',
      features: ['ค้นครูตามเครื่องดนตรีและพื้นที่', 'ข่าวและกิจกรรมดนตรี', 'หน้าภาษาไทย'],
      pricing: 'ค้นหาฟรี ค่าเรียนตกลงกับครูโดยตรง', limits: 'ข้อมูลครูมาจากสมาชิก — ตรวจประวัติ ค่าเรียน และตารางเองก่อนตัดสินใจ',
    }),
    D('chula-mooc', {
      site: 'mooc.chula.ac.th', platforms: ['web'], level: 'เริ่มต้น',
      traits: ['pathway', 'explorer'], style: ['structured'],
      about: 'รายวิชาออนไลน์ "ดนตรีบำบัดเบื้องต้น" ของ CHULA MOOC แนะนำหลักการใช้ดนตรีเพื่อสุขภาวะ เหมาะกับผู้ที่อยากรู้จักสายอาชีพดนตรีบำบัดก่อนตัดสินใจเรียนต่อ',
      features: ['วิดีโอบรรยายภาษาไทยโดยอาจารย์มหาวิทยาลัย', 'เรียนตามเวลาของตนเอง', 'เห็นตัวอย่างงานสายดนตรีบำบัดจริง'],
      pricing: 'เรียนฟรี (ตรวจรอบเปิดและเงื่อนไขใบประกาศที่หน้าวิชา)', limits: 'เป็นความรู้เบื้องต้น ไม่ใช่วุฒิวิชาชีพนักดนตรีบำบัด',
    }),
    D('thai-mooc', {
      site: 'thaimooc.ac.th', platforms: ['web'], level: 'เริ่มต้น',
      traits: ['culture', 'pathway'], style: ['structured'],
      about: 'รายวิชาออนไลน์ของมหาวิทยาลัยสงขลานครินทร์บน Thai MOOC ว่าด้วยศิลปกรรมท้องถิ่นชายแดนใต้ รวมดนตรีและการแสดงพื้นบ้าน เหมาะกับผู้สนใจดนตรีไทยและวัฒนธรรมท้องถิ่น',
      features: ['เนื้อหาภาษาไทยจากมหาวิทยาลัย', 'ศิลปะการแสดงและดนตรีพื้นบ้านภาคใต้', 'เรียนออนไลน์ตามเวลาของตนเอง'],
      pricing: 'เรียนฟรี', limits: 'เป็นความรู้เชิงวัฒนธรรม ไม่ได้สอนเล่นเครื่องดนตรี',
    }),
    D('mahidol', {
      site: 'www.music.mahidol.ac.th', platforms: ['web'], level: 'เตรียมเรียนต่อ/อาชีพ',
      traits: ['pathway', 'performer', 'reader'], style: ['teacher'],
      about: 'หน้ารับเข้าศึกษาของวิทยาลัยดุริยางคศิลป์ มหาวิทยาลัยมหิดล รวมหลักสูตรตั้งแต่เตรียมอุดม (Pre-college) ปริญญาตรี จนถึงบัณฑิตศึกษา พร้อมกำหนดการ คุณสมบัติ และเกณฑ์การสอบปฏิบัติ',
      features: ['สาขาเครื่องดนตรีคลาสสิก แจ๊ส ป๊อป ดนตรีไทย ธุรกิจดนตรี เทคโนโลยีดนตรี ฯลฯ', 'ประกาศรอบรับสมัครและเอกสารเกณฑ์สอบ', 'ข้อมูลหลักสูตรระยะสั้นและ Pre-college'],
      pricing: 'ค่าเล่าเรียนตามประกาศของหลักสูตร', limits: 'เกณฑ์และรอบเปลี่ยนทุกปี — ยึดประกาศล่าสุดบนเว็บวิทยาลัยเท่านั้น',
    }),
    D('soundbrenner', {
      appStoreId: 1048954353, site: 'www.soundbrenner.com', platforms: ['iphone', 'ipad', 'android'], level: 'ทุกระดับ',
      traits: ['rhythm', 'performer'], style: ['selfstudy'],
      about: 'เมโทรนอมจาก Soundbrenner ที่ออกแบบให้ตั้งจังหวะได้ละเอียด: แตะจังหวะ (tap tempo) ตั้งอัตราจังหวะซับซ้อน แบ่งจังหวะย่อย เน้นเสียงแต่ละตัว และบันทึก setlist ใช้ร่วมกับอุปกรณ์สั่นบนข้อมือของแบรนด์ได้',
      features: ['Tap tempo, subdivisions, accents ต่อจังหวะ', 'อัตราจังหวะซับซ้อนและ polyrhythm', 'บันทึก setlist และ preset สำหรับวง', 'ซิงก์กับอุปกรณ์ Soundbrenner Pulse/Core'],
      pricing: 'ดาวน์โหลดฟรี; ฟีเจอร์บางส่วนต้องซื้อในแอป', limits: 'ฟีเจอร์ขั้นสูงอยู่ในแพ็กเสียเงิน',
    }),
    D('tonalenergy', {
      appStoreId: 497716362, site: 'www.tonalenergy.com', platforms: ['iphone', 'ipad', 'android'], level: 'กลาง–ขั้นสูง',
      traits: ['rhythm', 'melody', 'performer'], style: ['selfstudy'],
      about: 'แอปจูนเนอร์และเมโทรนอมที่นักเรียนวงดุริยางค์และวงโยธวาทิตนิยม แสดงความเพี้ยนของเสียงแบบเรียลไทม์ด้วยหน้าหน้ายิ้ม มีเสียงอ้างอิง (drone) สำหรับฝึกเสียงให้ตรง และอัดเสียงตัวเองพร้อมวิเคราะห์',
      features: ['Tuner แสดงค่า cents และกราฟความนิ่งของเสียง', 'Drone/เสียงอ้างอิงสำหรับฝึก intonation', 'เมโทรนอมพร้อมจังหวะย่อยและ sequence', 'อัดเสียงและวิเคราะห์การเล่นของตัวเอง'],
      pricing: 'จ่ายครั้งเดียวในร้านแอป', limits: 'ต้องซื้อก่อนใช้; หน้าจอข้อมูลเยอะสำหรับมือใหม่',
    }),
    D('guitartuna', {
      instruments: ['guitar'], appStoreId: 527588389, site: 'guitartuna.com', platforms: ['iphone', 'ipad', 'android'], level: 'เริ่มต้น',
      traits: ['performer', 'melody', 'explorer'], style: ['play', 'selfstudy'],
      about: 'แอปตั้งเสียงกีตาร์จาก Yousician ที่ใช้ไมโครโฟนมือถือฟังสายแล้วบอกให้หมุนลูกบิดขึ้นหรือลง รองรับกีตาร์ เบส อูคูเลเล่ และจูนแบบพิเศษ พร้อมคอร์ดไลบรารี เมโทรนอม และเกมฝึกคอร์ด',
      features: ['จูนอัตโนมัติผ่านไมโครโฟน รองรับเครื่องสายหลายชนิด', 'จูนแบบพิเศษ (Drop D, Open G ฯลฯ)', 'คอร์ดไลบรารีและเกมฝึกเปลี่ยนคอร์ด', 'เมโทรนอมในตัว'],
      pricing: 'จูนเนอร์ใช้ฟรี; คอร์ด เพลง และเกมส่วนใหญ่อยู่ในสมาชิกแบบเสียเงิน', limits: 'ต้องมีกีตาร์/เครื่องสาย; ฟีเจอร์เรียนเพลงส่วนใหญ่ต้องจ่าย',
    }),
    D('moises', {
      appStoreId: 1515796612, site: 'moises.ai', platforms: ['iphone', 'ipad', 'android', 'web'], level: 'เริ่มต้น–ขั้นสูง',
      traits: ['performer', 'rhythm', 'melody', 'producer'], style: ['selfstudy'],
      about: 'แอปใช้ AI แยกเสียงร้อง กลอง เบส กีตาร์ และเครื่องอื่นออกจากเพลง (stem separation) จากนั้นปิดเสียงพาร์ตของเรา ปรับความเร็วและคีย์ ตรวจคอร์ดและจังหวะ เพื่อซ้อมเล่นตามหรือร้องคาราโอเกะกับเพลงจริง',
      features: ['แยก stems เสียงร้อง/กลอง/เบส/อื่นๆ', 'ปรับ tempo และ pitch โดยคุณภาพเสียงคงที่', 'ตรวจคอร์ดและเมโทรนอมตามเพลง', 'ใช้ได้ทั้งมือถือและเว็บ'],
      pricing: 'ใช้ฟรีได้จำกัด; Premium/Pro แบบสมัครสมาชิก', limits: 'ควรใช้กับเพลงที่มีสิทธิใช้งาน; ผลแยกเสียงไม่สมบูรณ์ทุกเพลง',
    }),
    D('anytune', {
      appStoreId: 415365180, site: 'www.anytune.app', platforms: ['iphone', 'ipad', 'mac'], level: 'กลาง',
      traits: ['performer', 'melody', 'rhythm'], style: ['selfstudy'],
      about: 'แอปแกะเพลงและซ้อมกับเพลงจริง: ลดความเร็วเพลงโดยเสียงไม่เพี้ยน วนช่วงที่ยาก เปลี่ยนคีย์ และทำเครื่องหมายท่อนเพลงเพื่อฝึกซ้ำจนคล่อง',
      features: ['ช้าลงหรือเร็วขึ้นโดยคงระดับเสียง', 'วนลูป A–B และมาร์กท่อนเพลง', 'ทรานสโพสคีย์', 'โหมดฝึกเพิ่มความเร็วทีละขั้น'],
      pricing: 'ดาวน์โหลดฟรี; ฟีเจอร์เต็มต้องซื้อในแอป', limits: 'ใช้กับไฟล์เพลงในเครื่อง; เน้นอุปกรณ์ Apple',
    }),
    D('ireal', {
      appStoreId: 298206806, site: 'www.irealpro.com', platforms: ['iphone', 'ipad', 'android', 'mac'], level: 'กลาง–ขั้นสูง',
      traits: ['performer', 'rhythm', 'melody'], style: ['selfstudy'],
      about: 'แอปแบ็กกิ้งแทร็กที่นักดนตรีแจ๊สใช้กันแพร่หลาย แสดงชาร์ตคอร์ดแล้วเล่นวงเสมือน (เปียโน/กีตาร์ เบส กลอง) ตามให้ ผู้ใช้ปรับสไตล์ ความเร็ว คีย์ และดาวน์โหลดชาร์ตหลายพันเพลงจากฟอรัมของชุมชน',
      features: ['วงแบ็กกิ้งเสมือนหลายสไตล์ (swing, bossa, funk ฯลฯ)', 'แก้/สร้างชาร์ตคอร์ดเอง', 'ฝึก improvisation ทุกคีย์', 'แชร์ชาร์ตกับเพื่อนร่วมวง'],
      pricing: 'จ่ายครั้งเดียว', limits: 'ไม่มีทำนองเพลงหรือเนื้อ — ต้องอ่านชาร์ตคอร์ดเป็น',
    }),
    D('tenuto', {
      appStoreId: 459313476, site: 'www.musictheory.net', platforms: ['iphone', 'ipad'], level: 'เริ่มต้น–กลาง',
      traits: ['reader', 'melody'], style: ['structured', 'selfstudy'],
      about: 'แอปแบบฝึกหัดทฤษฎีและโสตทักษะจาก musictheory.net สำหรับ iPhone/iPad รวมแบบฝึกเดียวกับบนเว็บให้ใช้แบบออฟไลน์ ทั้งอ่านโน้ต ขั้นคู่ คอร์ด และฝึกฟัง',
      features: ['แบบฝึกอ่านโน้ตและคีย์ซิกเนเจอร์', 'ฝึกฟังขั้นคู่ คอร์ด บันไดเสียง', 'แบบฝึกบนคีย์บอร์ดและเฟรตบอร์ด', 'ใช้ได้โดยไม่ต่ออินเทอร์เน็ต'],
      pricing: 'จ่ายครั้งเดียว', limits: 'มีเฉพาะ iOS; แบบฝึกบนเว็บใช้ได้ฟรี',
    }),
    D('garageband', {
      appStoreId: 408709785, site: 'www.apple.com', platforms: ['iphone', 'ipad'], level: 'เริ่มต้น–กลาง',
      traits: ['creator', 'producer', 'explorer'], style: ['play'],
      about: 'สตูดิโอพกพาจาก Apple บน iPhone/iPad มีเครื่องดนตรีแบบสัมผัส (Smart Instruments) ลูป Live Loops สำหรับทำบีต และอัดเสียงร้อง/กีตาร์ได้หลายแทร็ก เหมาะเป็นก้าวแรกของการแต่งและอัดเพลง',
      features: ['Smart Guitar/Keyboard/Drums เล่นคอร์ดได้แม้เล่นเครื่องจริงไม่เป็น', 'Live Loops และ Beat Sequencer', 'อัดเสียงหลายแทร็กพร้อมเอฟเฟกต์', 'ส่งงานต่อไปเปิดใน Logic Pro ได้'],
      pricing: 'ฟรี', limits: 'เฉพาะอุปกรณ์ Apple',
    }),
    D('hookpad', {
      site: 'www.hooktheory.com', platforms: ['web'], level: 'เริ่มต้น–กลาง',
      traits: ['creator', 'melody', 'reader'], style: ['play', 'structured'],
      about: 'เครื่องมือแต่งเพลงบนเว็บของ Hooktheory ที่เขียนเป็นเลขคอร์ด/ขั้นเสียงแทนโน้ตห้าเส้น ช่วยให้เข้าใจว่าคอร์ดไหนไปต่อกันได้ดี พร้อมฐานข้อมูลการวิเคราะห์เพลงดัง (TheoryTab) ให้ดูว่าเพลงจริงใช้คอร์ดอย่างไร',
      features: ['เขียนทำนองและคอร์ดด้วยระบบขั้นเสียงที่เปลี่ยนคีย์ได้ทันที', 'แนะนำคอร์ดถัดไปตามสถิติเพลงจริง', 'ดูตัวอย่างจาก TheoryTab หลายหมื่นเพลง', 'ส่งออกเป็น MIDI/MusicXML'],
      pricing: 'ใช้ฟรีได้จำกัด; เวอร์ชันเต็มแบบสมัครสมาชิก', limits: 'ต้องใช้บนคอมเป็นหลัก; ภาษาอังกฤษ',
    }),
    D('songbook', {
      instruments: ['guitar', 'keys', 'vocal'], appStoreId: 392888837, site: 'linkesoft.com', platforms: ['iphone', 'ipad', 'android', 'windows', 'mac'], level: 'กลาง',
      traits: ['performer', 'melody'], style: ['selfstudy'],
      about: 'แอปเก็บเนื้อเพลงพร้อมคอร์ดรูปแบบ ChordPro สำหรับเล่นบนเวทีหรือซ้อม ทรานสโพสคีย์ แสดงแผนผังคอร์ดกีตาร์/อูคูเลเล่/เปียโน เลื่อนหน้าอัตโนมัติ และจัด setlist',
      features: ['นำเข้า/เขียนเนื้อเพลง + คอร์ด (ChordPro)', 'เปลี่ยนคีย์และแสดงแผนผังคอร์ด', 'เลื่อนหน้าอัตโนมัติและควบคุมด้วยแป้นเหยียบ', 'setlist และซิงก์หลายอุปกรณ์'],
      pricing: 'จ่ายครั้งเดียวต่อแพลตฟอร์ม', limits: 'ต้องหาหรือพิมพ์เนื้อ/คอร์ดเอง (ไม่มีเพลงให้ในแอป)',
    }),
    D('forscore', {
      appStoreId: 363738376, site: 'forscore.co', platforms: ['ipad', 'iphone', 'mac'], level: 'กลาง–ขั้นสูง',
      traits: ['performer', 'reader'], style: ['selfstudy'],
      about: 'แอปอ่านโน้ตเพลง PDF ยอดนิยมบน iPad สำหรับนักดนตรีคลาสสิก วงและคอรัส จัดคลังโน้ต เขียนหมายเหตุด้วย Apple Pencil เปิดหน้าด้วยแป้นเหยียบหรือท่าทาง และจัด setlist สำหรับการแสดง',
      features: ['คลังโน้ต PDF พร้อมเมทาดาทาและ setlist', 'เขียนหมายเหตุ/ปากกาบนโน้ต', 'เปิดหน้าด้วยแป้นเหยียบบลูทูธหรือใบหน้า', 'เมโทรนอม จูนเนอร์ และเครื่องอัดในตัว'],
      pricing: 'จ่ายครั้งเดียว; มีสมาชิกเสริม forScore Pro', limits: 'เหมาะกับ iPad จอใหญ่; ไม่มีบน Android',
    }),
    D('audacity', {
      site: 'www.audacityteam.org', platforms: ['windows', 'mac', 'linux'], level: 'เริ่มต้น',
      traits: ['producer', 'creator'], style: ['selfstudy'],
      about: 'โปรแกรมอัดและตัดต่อเสียงฟรีแบบโอเพนซอร์ส ใช้อัดเสียงร้อง พอดแคสต์ หรือเดโม ตัด ต่อ ลดเสียงรบกวน และใส่เอฟเฟกต์พื้นฐาน ก่อนส่งออกเป็นไฟล์เสียง',
      features: ['อัดและตัดต่อเสียงหลายแทร็ก', 'ลดเสียงรบกวน, EQ, compressor', 'รองรับปลั๊กอิน VST3/AU/LV2', 'ส่งออก WAV, MP3, FLAC ฯลฯ'],
      pricing: 'ฟรีและโอเพนซอร์ส', limits: 'ไม่ใช่ DAW สำหรับทำบีต/MIDI',
    }),
    D('reaper', {
      site: 'www.reaper.fm', platforms: ['windows', 'mac', 'linux'], level: 'กลาง–ขั้นสูง',
      traits: ['producer', 'creator'], style: ['selfstudy'],
      about: 'DAW ขนาดเบาจาก Cockos ที่ปรับแต่งได้แทบทุกส่วน อัดเสียงหลายแทร็ก MIDI มิกซ์ และมาสเตอร์ได้ครบ ลงง่ายแม้คอมสเปกไม่สูง ทดลองใช้เต็มฟีเจอร์ได้ก่อนซื้อไลเซนส์ราคาย่อมเยา',
      features: ['อัด/ตัดต่อ/มิกซ์ไม่จำกัดแทร็ก', 'MIDI editing และรองรับปลั๊กอิน VST/AU', 'ปรับแต่งด้วยธีม แอ็กชัน และสคริปต์', 'ไฟล์ติดตั้งเล็ก ใช้ทรัพยากรน้อย'],
      pricing: 'ทดลองใช้เต็มฟีเจอร์ได้ แล้วซื้อไลเซนส์ (มีราคาสำหรับใช้ส่วนตัว)', limits: 'หน้าจอเริ่มต้นเรียบ ต้องใช้เวลาตั้งค่า',
    }),
    D('ableton-live', {
      site: 'www.ableton.com', platforms: ['windows', 'mac'], level: 'กลาง–ขั้นสูง',
      traits: ['producer', 'creator', 'performer'], style: ['play', 'selfstudy'],
      about: 'DAW ที่โดดเด่นเรื่องการทำเพลงแบบลูปและการเล่นสด ด้วย Session View ที่เรียกคลิปเสียงสลับไปมาได้ทันที ใช้ทำบีต อิเล็กทรอนิกส์ ป๊อป และเล่นสดบนเวทีร่วมกับคอนโทรลเลอร์',
      features: ['Session View สำหรับแจมและเล่นสด', 'Warp ปรับความเร็วเสียงให้เข้าจังหวะ', 'เครื่องดนตรีและเอฟเฟกต์ในตัว (มากขึ้นตามรุ่น Intro/Standard/Suite)', 'ทำงานร่วมกับคอนโทรลเลอร์ เช่น Push'],
      pricing: 'มีช่วงทดลองใช้ฟรี; ซื้อรุ่น Intro/Standard/Suite', limits: 'ราคารุ่นเต็มค่อนข้างสูง',
    }),
    D('dorico-se', {
      appSearch: { term: 'Dorico', seller: 'Steinberg' }, site: 'www.steinberg.net', platforms: ['windows', 'mac'], level: 'เริ่มต้น–กลาง',
      traits: ['reader', 'creator'], style: ['selfstudy'],
      about: 'Dorico รุ่นฟรีจาก Steinberg สำหรับเขียนโน้ตคุณภาพระดับสิ่งพิมพ์ จำกัดจำนวนผู้เล่นในหนึ่งโปรเจกต์ เหมาะกับเพลงเดี่ยวหรือวงเล็ก และอัปเกรดไป Elements/Pro ได้',
      features: ['จัดหน้าโน้ตอัตโนมัติสวยงามระดับสิ่งพิมพ์', 'เล่นเสียงตัวอย่างด้วยไลบรารีในตัว', 'รองรับผู้เล่นจำนวนจำกัดต่อโปรเจกต์', 'มีรุ่น iPad ด้วย'],
      pricing: 'ฟรี (ต้องมี Steinberg ID)', limits: 'จำกัดจำนวนผู้เล่น; ต้องติดตั้งผ่าน Steinberg Download Assistant',
    }),
    D('logic-ipad', {
      appStoreId: 1615087040, site: 'www.apple.com', platforms: ['ipad'], level: 'กลาง–ขั้นสูง',
      traits: ['producer', 'creator'], style: ['play', 'selfstudy'],
      about: 'Logic Pro เวอร์ชัน iPad ที่ออกแบบสำหรับจอสัมผัส มีเครื่องดนตรี ลูป เครื่องมือแยก stems และ Session Players ช่วยเล่นดนตรีประกอบ สำหรับผู้ที่อยากผลิตเพลงเต็มรูปแบบบน iPad',
      features: ['อัด มิกซ์ และตัดต่อเต็มรูปแบบด้วยนิ้ว/Apple Pencil', 'เครื่องดนตรีและ Session Players', 'Stem Splitter แยกเสียงจากไฟล์', 'ส่งต่อโปรเจกต์ไป Logic Pro บน Mac'],
      pricing: 'สมัครสมาชิกรายเดือน/ปี (มีช่วงทดลอง)', limits: 'ต้องใช้ iPad รุ่นที่รองรับ',
    }),
    D('qlab', {
      site: 'qlab.app', platforms: ['mac'], level: 'กลาง–ขั้นสูง',
      traits: ['performer', 'producer'], style: ['selfstudy'],
      about: 'ซอฟต์แวร์ควบคุมคิวเสียง วิดีโอ และแสงสำหรับละครเวที คอนเสิร์ต และงานอีเวนต์ จาก Figure 53 เรียงคิวที่ต้องเล่นตามลำดับแล้วกด GO ระหว่างการแสดง',
      features: ['คิวเสียง วิดีโอ แสง และ MIDI/OSC', 'ตั้ง fade และการเล่นคิวพร้อมกัน', 'ใช้ฟรีได้พื้นฐาน; ไลเซนส์เปิดฟีเจอร์ขั้นสูง', 'เป็นมาตรฐานงานละครเวทีจำนวนมาก'],
      pricing: 'ใช้ฟรีแบบจำกัด; เช่า/ซื้อไลเซนส์ตามงาน', limits: 'เฉพาะ macOS; เน้นงานฝ่ายเทคนิคการแสดง',
    }),
    D('soundslice', {
      site: 'www.soundslice.com', platforms: ['web'], level: 'เริ่มต้น–กลาง',
      traits: ['performer', 'reader', 'melody'], style: ['selfstudy', 'structured'],
      about: 'แพลตฟอร์มโน้ตเพลงแบบโต้ตอบที่ผูกโน้ต/แท็บเข้ากับเสียงหรือวิดีโอจริง เล่นแล้วเคอร์เซอร์เลื่อนตาม ปรับความเร็ว วนท่อน และมีคอร์สจากครูที่เผยแพร่บนแพลตฟอร์ม',
      features: ['โน้ต/แท็บซิงก์กับวิดีโอหรือเสียงจริง', 'ปรับความเร็วและวนท่อนที่ยาก', 'แสดงนิ้วบนเฟรตบอร์ด/คีย์บอร์ด', 'ครูใช้สร้างบทเรียนขายได้'],
      pricing: 'ดูบทเรียนที่แชร์ได้ฟรี; สร้าง/จัดเก็บโน้ตเต็มรูปแบบแบบสมาชิก', limits: 'ภาษาอังกฤษ; คอร์สบางส่วนเสียเงินแยก',
    }),
    D('flat', {
      appSearch: { term: 'Flat', seller: 'Tutteo' }, site: 'flat.io', platforms: ['web', 'iphone', 'ipad', 'android'], level: 'เริ่มต้น–กลาง',
      traits: ['reader', 'creator'], style: ['selfstudy', 'play'],
      about: 'โปรแกรมเขียนโน้ตบนเว็บที่ทำงานร่วมกันได้แบบ Google Docs เขียนโน้ตและแท็บในเบราว์เซอร์หรือแอป แชร์ให้เพื่อนหรือครูแก้ไขพร้อมกัน และมีรุ่นสำหรับห้องเรียน',
      features: ['เขียนโน้ต/แท็บบนเว็บและแท็บเล็ต', 'แก้ไขร่วมกันแบบเรียลไทม์และแสดงความเห็น', 'ใช้ร่วมกับ Google Classroom (Flat for Education)', 'นำเข้า/ส่งออก MusicXML, MIDI'],
      pricing: 'ใช้ฟรีได้จำกัด; Power/Education แบบสมาชิก', limits: 'ต้องต่ออินเทอร์เน็ต; ฟีเจอร์เต็มต้องจ่าย',
    }),
    D('pro-tools', {
      site: 'www.avid.com', platforms: ['windows', 'mac'], level: 'ขั้นสูง/มืออาชีพ',
      traits: ['producer'], style: ['selfstudy'],
      about: 'DAW มาตรฐานของสตูดิโออัดเสียงและงานโพสต์โปรดักชันจาก Avid ใช้อัด ตัดต่อ และมิกซ์ทั้งเพลงและเสียงภาพยนตร์ มีรุ่น Intro ใช้ฟรีสำหรับเริ่มต้น',
      features: ['อัดและตัดต่อเสียงระดับสตูดิโอ', 'มิกซ์และระบบ bus/routing แบบมืออาชีพ', 'เป็นรูปแบบโปรเจกต์ที่สตูดิโอใช้แลกเปลี่ยนกัน', 'รุ่น Intro ฟรี จำกัดจำนวนแทร็ก'],
      pricing: 'Pro Tools Intro ฟรี; Artist/Studio/Ultimate แบบสมาชิก', limits: 'เรียนรู้นานกว่า DAW สำหรับมือใหม่; ต้องมีบัญชี Avid',
    }),
    D('logic-mac', {
      appStoreId: 634148309, site: 'www.apple.com', platforms: ['mac'], level: 'กลาง–ขั้นสูง',
      traits: ['producer', 'creator'], style: ['selfstudy'],
      about: 'DAW ระดับมืออาชีพของ Apple บน Mac มีเครื่องดนตรี เอฟเฟกต์ และลูปจำนวนมากในราคาเดียว รวม Session Players และเครื่องมือมิกซ์/มาสเตอร์ เป็นขั้นต่อจาก GarageBand ที่เปิดโปรเจกต์เดิมได้',
      features: ['เครื่องดนตรี เอฟเฟกต์ และลูปจำนวนมากในตัว', 'Session Players (Drummer, Bass, Keyboard)', 'Stem Splitter และเครื่องมือมาสเตอร์', 'Live Loops และรองรับ Dolby Atmos'],
      pricing: 'จ่ายครั้งเดียวใน Mac App Store (มีทดลองใช้)', limits: 'เฉพาะ Mac',
    }),
    D('dorico-pro', {
      appSearch: { term: 'Dorico', seller: 'Steinberg' }, site: 'www.steinberg.net', platforms: ['windows', 'mac'], level: 'ขั้นสูง/มืออาชีพ',
      traits: ['reader', 'creator'], style: ['selfstudy'],
      about: 'Dorico รุ่นเต็มสำหรับนักประพันธ์ ผู้เรียบเรียง และสำนักพิมพ์โน้ต รองรับวงออร์เคสตราขนาดใหญ่ งานดนตรีประกอบภาพ และการจัดหน้าโน้ตระดับสิ่งพิมพ์',
      features: ['ไม่จำกัดผู้เล่น เหมาะงานวงใหญ่', 'จัดหน้าและกราฟิกโน้ตละเอียดระดับสำนักพิมพ์', 'โหมด Play สำหรับ mockup เสียงสมจริง', 'เครื่องมือเรียบเรียงและ condensing อัตโนมัติ'],
      pricing: 'ทดลองใช้ แล้วซื้อไลเซนส์ (มีราคาการศึกษา)', limits: 'ราคาสูง; เกินความจำเป็นสำหรับงานเล็ก',
    }),
    D('sibelius', {
      appSearch: { term: 'Sibelius', seller: 'Avid' }, site: 'www.avid.com', platforms: ['windows', 'mac', 'ipad', 'iphone'], level: 'กลาง–ขั้นสูง',
      traits: ['reader', 'creator'], style: ['selfstudy'],
      about: 'โปรแกรมเขียนโน้ตที่ใช้กันแพร่หลายในโรงเรียนดนตรีและวงการประพันธ์เพลง จาก Avid มีรุ่น First (ฟรี), Artist และ Ultimate และใช้บน iPad ได้',
      features: ['เขียนโน้ตรวดเร็วด้วยคีย์ลัดและ MIDI keyboard', 'เล่นเสียงตัวอย่างด้วย Sibelius Sounds', 'ระดับรุ่นตั้งแต่ฟรีถึงมืออาชีพ', 'ใช้บนคอมและ iPad'],
      pricing: 'Sibelius First ฟรี; Artist/Ultimate แบบสมาชิกหรือไลเซนส์', limits: 'ฟีเจอร์ต่างกันมากตามรุ่น',
    }),
    D('mainstage', {
      appStoreId: 634159523, site: 'www.apple.com', platforms: ['mac'], level: 'ขั้นสูง',
      traits: ['performer', 'producer'], style: ['selfstudy'],
      about: 'แอปของ Apple สำหรับเล่นสดบนเวทีด้วย Mac: เปลี่ยนเสียงคีย์บอร์ด กีตาร์ และแบ็กกิ้งแทร็กตามเพลงในเซ็ต ควบคุมด้วยคอนโทรลเลอร์ และใช้เสียงเดียวกับ Logic Pro',
      features: ['จัดชุดเสียง (patch) ตามเพลงและ setlist', 'เล่นแบ็กกิ้งแทร็กและคลิกไปพร้อมกัน', 'แมปคอนโทรลเลอร์/แป้นเหยียบ', 'ใช้เครื่องดนตรีและเอฟเฟกต์ชุดเดียวกับ Logic Pro'],
      pricing: 'จ่ายครั้งเดียวใน Mac App Store', limits: 'ต้องมี Mac + คอนโทรลเลอร์/ออดิโออินเทอร์เฟซ',
    }),
  ]);

  const PLATFORM_LABEL = { iphone: 'iPhone', ipad: 'iPad', android: 'Android', mac: 'Mac', windows: 'Windows', linux: 'Linux', web: 'เว็บเบราว์เซอร์' };
  const appStoreUrl = id => `https://apps.apple.com/th/app/id${id}`;
  return { details, PLATFORM_LABEL, appStoreUrl };
});
