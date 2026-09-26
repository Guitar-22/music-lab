'use strict';
// จัดประเภทสถานที่ให้เข้ากับชั้นของ Ecosystem ดนตรี (ดู 26-thailand-music-ecosystem.md)
const KINDS = {
  school:           { layer: 'learn',   label: 'โรงเรียน/สถาบันสอนดนตรี' },
  higher_ed:        { layer: 'learn',   label: 'คณะ/วิทยาลัยดนตรี' },
  instrument_store: { layer: 'gear',    label: 'ร้านเครื่องดนตรีและอุปกรณ์' },
  audio_store:      { layer: 'gear',    label: 'ร้านเครื่องเสียง/Pro audio' },
  repair_luthier:   { layer: 'gear',    label: 'ซ่อม/ทำเครื่องดนตรี' },
  record_store:     { layer: 'listen',  label: 'ร้านแผ่นเสียง/สื่อเพลง' },
  studio:           { layer: 'create',  label: 'สตูดิโออัดเสียง' },
  rehearsal:        { layer: 'create',  label: 'ห้องซ้อมดนตรี' },
  venue:            { layer: 'perform', label: 'เวทีดนตรีสด' },
  performing_arts:  { layer: 'perform', label: 'โรงละคร/หอแสดง/ศูนย์ศิลปะ' },
  broadcast:        { layer: 'listen',  label: 'สถานีวิทยุ/สื่อ' },
  karaoke:          { layer: 'listen',  label: 'คาราโอเกะ' },
  ensemble:         { layer: 'perform', label: 'วงดนตรี/ออร์เคสตรา' },
  archive:          { layer: 'learn',   label: 'หอสมุด/พิพิธภัณฑ์/คลังดนตรี' },
  business:         { layer: 'business', label: 'ค่ายเพลง/ลิขสิทธิ์/ธุรกิจดนตรี' },
  excluded:         { layer: 'none',    label: 'ไม่เกี่ยวกับดนตรี (คัดออก)' },
  unclassified:     { layer: 'review',  label: 'รอจัดประเภท' },
};

const MUSIC = /ดนตรี|เพลง|มิวสิ[คก]|music|musik|guitar|กีตาร์|piano|เปียโน|drum|กลอง|violin|ไวโอลิน|jazz|แจ๊ส|ukulele|อูคูเลเล่|saxophone|แซกโซโฟน|ระนาด|ขิม|vocal|ร้องเพลง|band|วงดนตรี|orchestra|ออร์เคสตรา|symphony|ซิมโฟนี/i;
const LEARN = /school|academy|institute|โรงเรียน|สถาบัน|สอน|เรียน|lesson|class|คอร์ส|conservatory/i;

function classify(tags = {}) {
  const name = [tags.name, tags['name:en'], tags['name:th']].filter(Boolean).join(' ');
  const t = k => tags[k] || '';
  if (/musical_instrument|piano_tuner|luthier/.test(t('craft'))) return 'repair_luthier';
  if (t('shop') === 'musical_instrument') return 'instrument_store';
  if (t('shop') === 'music') return 'record_store';
  if (t('shop') === 'hifi') return 'audio_store';
  if (/\b(comedy|snake|venom)\b|งู|ตลก/i.test(name)) return 'excluded';
  if (/หอสมุด|library|museum|พิพิธภัณฑ์|archive/i.test(name) && MUSIC.test(name)) return 'archive';
  if (t('amenity') === 'music_school' || (t('amenity') === 'school' && MUSIC.test(name)) || (MUSIC.test(name) && LEARN.test(name) && !/university|มหาวิทยาลัย/i.test(name))) return 'school';
  if (/university|college|มหาวิทยาลัย|วิทยาลัย|คณะ/i.test(name) && /ดุริยาง|ดนตรี|music|นาฏศิลป์/i.test(name)) return 'higher_ed';
  if (/ห้องซ้อม|rehearsal/i.test(name)) return 'rehearsal';
  if (/^(radio|television|video)$/.test(t('studio')) || /วิทยุ|radio|fm\s?\d/i.test(name)) return 'broadcast';
  if (/^(audio|music|recording)$/.test(t('studio')) || /recording|อัดเสียง|record studio|sound studio/i.test(name)) return 'studio';
  if (/orchestra|ออร์เคสตรา|symphony orchestra|วงดุริยางค์|ensemble/i.test(name)) return 'ensemble';
  if (/^(music_venue|concert_hall)$/.test(t('amenity')) || t('live_music') === 'yes' || /live (music|house)|jazz (bar|club)|แจ๊ส/i.test(name)) return 'venue';
  // บาร์/ผับ/คาเฟ่ที่ชื่อบอกว่าเป็นดนตรี (\b กัน "Music Publishing" ติดเป็น pub) เช่น "Music Bar", "Jazz & Vinyl Bar", "Saxophone Pub"
  if (/(music|jazz|vinyl|saxophone|blues|rock).{0,20}\b(bar|pub|cafe|café|club|lounge)\b|\b(bar|pub|cafe|club)\b.{0,12}(music|jazz)/i.test(name)) return 'venue';
  if (/^(theatre|arts_centre)$/.test(t('amenity'))) return 'performing_arts';
  if (t('amenity') === 'karaoke_box' || /karaoke|คาราโอเกะ/i.test(name)) return 'karaoke';
  if (/records|label|ค่ายเพลง|publishing|ลิขสิทธิ์เพลง/i.test(name) && MUSIC.test(name + ' ' + t('office'))) return 'business';
  if (t('amenity') === 'studio' && !t('studio')) return 'studio';
  // ชื่อที่บังเอิญมีคำดนตรี: "แม่กลอง" (ชื่อจังหวัด/ทางรถไฟ), ร้านอาหารชื่อ "น่องกลอง" ฯลฯ — ถ้าไม่ใช่เวทีดนตรีตามกฎด้านบน ให้คัดออก
  if (!MUSIC.test(name.replace(/แม่กลอง/g, ''))) return 'excluded';
  if (/^(restaurant|cafe|fast_food|food_court|marketplace)$/.test(t('amenity')) || /^(food|bakery|butcher|seafood|convenience|supermarket)$/.test(t('shop'))) return 'excluded';
  return 'unclassified';
}

module.exports = { KINDS, classify, MUSIC };
