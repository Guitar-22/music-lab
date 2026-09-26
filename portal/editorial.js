(function (root) {
  'use strict';
  // Images are loaded from the publisher or official app listing. They are not copied into this project.
  const appStore = id => `https://apps.apple.com/us/app/id${id}`;
  const previews = {
    'pro-tools': { url: 'https://edge.sitecorecloud.io/avidtech-d6a2e9a9/media/images/pro-tools/overview/01-beatmaking.jpg?h=900&iar=0&w=1200', source: 'https://www.avid.com/pro-tools', credit: 'ภาพจาก Avid', kind: 'ภาพผลิตภัณฑ์' },
    'ableton-live': { url: 'https://beta-ableton.imgix.net/media/b2qnxryw/screenshot-session-view.png?auto=compress%2Cformat&format=webp&height=1600&q=80&width=1600', source: 'https://www.ableton.com/en/live/what-is-live/', credit: 'ภาพจาก Ableton', kind: 'ภาพหน้าจอ Session View' },
    reaper: { url: 'https://www.reaper.fm/v7img/ss_persp_v7.jpg', source: 'https://www.reaper.fm/', credit: 'ภาพจาก Cockos', kind: 'ภาพหน้าจอ REAPER' },
    'logic-mac': { url: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/06/d1/04/06d10446-76db-3e53-adc2-9500027c29f0/1._20250909_Session_Players_-_Synth_Player_2880x1800_-_no-alpha.png/800x500bb.jpg', source: appStore(634148309), credit: 'ภาพจาก Mac App Store', kind: 'ภาพหน้าจอ Logic Pro' },
    'dorico-pro': { url: 'https://blog.dorico.com/wp-content/uploads/2024-11-12-16-57-59-Dorico-6-photo-shoot-HDR-Edit-2500-1080x675.jpg', source: 'https://blog.dorico.com/2025/04/dorico-6-released/', credit: 'ภาพจาก Steinberg', kind: 'ภาพผลิตภัณฑ์ Dorico 6' },
    sibelius: { url: 'https://edge.sitecorecloud.io/avidtech-d6a2e9a9/media/images/homepage/2026/08/acd-prod-sib-frame1.jpg?h=1080&iar=0&w=1920', source: 'https://www.avid.com/sibelius', credit: 'ภาพจาก Avid', kind: 'ภาพผลิตภัณฑ์ Sibelius' },
    musescore: { url: 'https://3455969201-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FP81HaeapLzzJGtG6DSwH%2Fuploads%2Fgit-blob-dbb667414111d59ab77226c5de57247ae0bf2171%2Fscore-tab.png?alt=media', source: 'https://handbook.musescore.org/navigation/the-user-interface', credit: 'ภาพจาก MuseScore Studio Handbook', kind: 'ภาพหน้าจอ Score tab' },
    qlab: { url: 'https://qlab.app/_next/image/?q=75&url=%2F_next%2Fstatic%2Fmedia%2Findustry-standard.0b_51dk2hr9te.png&w=3840', source: 'https://qlab.app/overview/', credit: 'ภาพจาก Figure 53', kind: 'ภาพหน้าจอ QLab' },
    bandlab: { url: 'https://help.bandlab.com/hc/article_attachments/57472287711385', source: 'https://help.bandlab.com/hc/en-us/articles/115002945153-Getting-Started-with-the-BandLab-Studio', credit: 'ภาพจาก BandLab Help Center', kind: 'ภาพหน้าจอ Studio' },
    forscore: { url: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/86/07/d6/8607d606-4fa1-eef6-031f-4b03f130c8a1/130-1.png/360x480bb.jpg', source: appStore(363738376), credit: 'ภาพจาก App Store', kind: 'ภาพหน้าจอแอป' },
    soundbrenner: { url: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/68/5e/69/685e6967-55b8-da83-cb7e-e427101ca1d8/1_New_iPhone_U002c_English.jpg/320x480bb.jpg', source: appStore(1048954353), credit: 'ภาพจาก App Store', kind: 'ภาพหน้าจอแอป' },
    tonalenergy: { url: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource124/v4/e0/46/c3/e046c393-aade-be49-73b7-5d03f97c25cd/9fd43f16-d8a2-474b-8d2f-dbb3349a641e_tet_iphone55_english_1.png/392x696bb.png', source: appStore(497716362), credit: 'ภาพจาก App Store', kind: 'ภาพหน้าจอแอป' },
    guitartuna: { url: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/f7/62/12/f76212f7-e828-9df9-d3ef-b83d7bcf2184/6a6582ff-b93a-4fae-afe6-54c19e5ac1a3_App_store_GT_9x16_1242x2208_1.png/392x696bb.png', source: appStore(527588389), credit: 'ภาพจาก App Store', kind: 'ภาพหน้าจอแอป' },
    moises: { url: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/29/0d/61/290d617e-8618-523e-7c8c-4575c45d7f6d/-00.png/320x480bb.jpg', source: appStore(1515796612), credit: 'ภาพจาก App Store', kind: 'ภาพหน้าจอแอป' },
    anytune: { url: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/25/e4/8f/25e48f6b-ecef-a048-0cd6-e46d2dd469bc/EN_-_iPhone_5.5_-_1.png/392x696bb.png', source: appStore(415365180), credit: 'ภาพจาก App Store', kind: 'ภาพหน้าจอแอป' },
    ireal: { url: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/6b/d3/20/6bd320d5-94a4-c914-9698-36865debe3cb/screenshot_1.png/320x480bb.jpg', source: appStore(298206806), credit: 'ภาพจาก App Store', kind: 'ภาพหน้าจอแอป' },
    tenuto: { url: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource124/v4/f4/b1/5f/f4b15f3f-7e22-8b79-eb69-a1da667399b7/11bec6f3-b3b4-4200-84ad-ccd73c21d144_Simulator_Screen_Shot_-_iPhone_8_Plus_-_2020-08-31_at_19.55.48.png/392x696bb.png', source: appStore(459313476), credit: 'ภาพจาก App Store', kind: 'ภาพหน้าจอแอป' },
    garageband: { url: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/c0/89/9c/c0899c26-2357-eca8-d124-a987e954da36/20eb6e0f-d341-4cba-93d4-217800def9ab_iPad_Pro_2ndGen_SL-USA.PNG/552x414bb.png', source: appStore(408709785), credit: 'ภาพจาก App Store', kind: 'ภาพหน้าจอแอป' },
    songbook: { url: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/66/7b/28/667b285e-db05-83bd-84d1-a8361d04613e/Simulator_Screenshot_-_iPad_Pro_13-inch__U0028M5_U0029_-_2025-12-13_at_10.52.33.png/360x480bb.jpg', source: appStore(392888837), credit: 'ภาพจาก App Store', kind: 'ภาพหน้าจอแอป' },
    'logic-ipad': { url: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/42/53/30/42533050-f6b5-e73b-fbe3-680256666373/83693f1b-57ea-4142-bd48-dfc06e508813_1._20240325_-_Hero_-_LPiP_-_129_-_iPad_Pro_-_EN.png/552x414bb.png', source: appStore(1615087040), credit: 'ภาพจาก App Store', kind: 'ภาพหน้าจอแอป' },
    mainstage: { url: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/0f/0f/71/0f0f715e-3461-67f6-3218-615d34f87ce7/1._20250927_Backing_Tracks__U0026_Keys_2880x1800_-_no-alpha.png/800x500bb.jpg', source: appStore(634159523), credit: 'ภาพจาก Mac App Store', kind: 'ภาพหน้าจอ MainStage' }
  };

  // Editorial order for the stated job, not a global market-share ranking.
  const rankings = [
    { id: 'studio', title: 'อัดและมิกซ์ในสตูดิโอ', audience: 'Recording engineer / mixer', basis: 'งานอัดหลาย take, edit และส่ง session ให้ทีม', picks: [
      { id: 'pro-tools', reason: 'หลักฐานการใช้งานระดับอาชีพตรงกับงาน tracking, editing และ mixing มากที่สุดในชุดงานวิจัยที่ตรวจ', evidence: 'งานสำรวจ SMC 2025: professional tracking/editing/mixing อยู่ลำดับแรก', evidenceUrl: 'https://avanzini.di.unimi.it/downloads/publications/avanzini_smc25.pdf', confidence: 'สูงสำหรับโจทย์สตูดิโอ' },
      { id: 'ableton-live', reason: 'เหมาะเมื่อการอัดต้องเชื่อมกับ loop, sequencing และการทำเพลงอิเล็กทรอนิกส์', evidence: 'งานสำรวจ SMC 2025: อันดับสองใน professional tracking และ mixing', evidenceUrl: 'https://avanzini.di.unimi.it/downloads/publications/avanzini_smc25.pdf', confidence: 'ปานกลาง' },
      { id: 'reaper', reason: 'ทางเลือกข้ามระบบปฏิบัติการที่ปรับ workflow ได้มาก และมี trial สำหรับทดลองจริง', evidence: 'งานสำรวจ SMC 2025: professional mastering/post-production อันดับสอง', evidenceUrl: 'https://avanzini.di.unimi.it/downloads/publications/avanzini_smc25.pdf', confidence: 'ปานกลาง' }
    ] },
    { id: 'electronic', title: 'แต่งและผลิตเพลงอิเล็กทรอนิกส์', audience: 'Producer / songwriter', basis: 'ร่างไอเดีย MIDI, samples, arrangement และเล่นสด', picks: [
      { id: 'ableton-live', reason: 'Session View ช่วยทดลองและเล่น loop สด; งานสำรวจพบเด่นใน professional sequencing และ electronic music', evidence: 'SMC 2025 ตารางงาน/บริบทระดับ professional; Berklee ใช้สอน Electronic Production', evidenceUrl: 'https://college.berklee.edu/electronic-production-design/epd-major-application-faq', confidence: 'สูงสำหรับโจทย์นี้' },
      { id: 'logic-mac', reason: 'เหมาะกับคนใช้ Mac ที่ต้องการเครื่องดนตรีเสมือน การอัด และแต่งเพลงในโปรเจกต์เดียว', evidence: 'Berklee NYC มีรายวิชา Producing in Logic Pro; SMC พบเป็นอันดับสองใน professional sequencing', evidenceUrl: 'https://nyc.berklee.edu/songwriting-and-production', confidence: 'ปานกลาง' },
      { id: 'bandlab', reason: 'จุดเริ่มฟรีบนมือถือ/เว็บสำหรับทำเดโมก่อนย้ายไป DAW เต็มรูปแบบ', evidence: 'BandLab ระบุ Studio ฟรีและขั้นตอนสร้างโปรเจกต์; ไม่ใช่ข้อสรุปว่ามีส่วนแบ่งระดับโปรสูง', evidenceUrl: 'https://help.bandlab.com/hc/en-us/articles/115002945153-Getting-Started-with-the-BandLab-Studio', confidence: 'สูงเรื่องการเข้าถึง; ต่ำเรื่องการใช้ระดับโปร' }
    ] },
    { id: 'score', title: 'เขียน score และ part ให้ผู้เล่น', audience: 'Composer / arranger / copyist', basis: 'ความชัดของโน้ต, part, งานพิมพ์ และไฟล์ที่ทีมรับได้', picks: [
      { id: 'dorico-pro', reason: 'เหมาะกับ score และ part ที่ต้องจัดหน้าอย่างละเอียด; มีหลักสูตรเตรียมโน้ตระดับเผยแพร่โดยตรง', evidence: 'Berklee Online: Music Notation and Score Preparation Using Dorico Pro', evidenceUrl: 'https://online.berklee.edu/courses/music-notation-and-score-preparation-using-dorico-pro', confidence: 'ปานกลาง; ขึ้นกับไฟล์ที่ทีมใช้' },
      { id: 'sibelius', reason: 'เลือกก่อนเมื่อผู้ว่าจ้างหรือทีมส่งงานเป็นไฟล์ Sibelius และต้องแก้ต่อในระบบเดิม', evidence: 'Berklee Online มีหลักสูตร Sibelius Ultimate และเปรียบเทียบซอฟต์แวร์โน้ต', evidenceUrl: 'https://online.berklee.edu/help/notation-software/2078428', confidence: 'ปานกลาง; ขึ้นกับทีม' },
      { id: 'musescore', reason: 'จุดเริ่มฟรีที่สอนและแชร์ตัวอย่างได้ง่าย ก่อนตัดสินใจซื้อเครื่องมือขั้นสูง', evidence: 'Berklee Online ระบุว่าหลายวิชาด้าน notation ใช้ MuseScore', evidenceUrl: 'https://online.berklee.edu/help/notation-software/2078428', confidence: 'สูงสำหรับการเริ่มเรียน' }
    ] }
  ];

  root.MILPro = { previews, rankings };
})(typeof window !== 'undefined' ? window : globalThis);
