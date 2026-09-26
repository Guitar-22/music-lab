const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('./core.js');

test('ภารกิจให้คะแนนตามตัวเลือกและไม่ให้คะแนนข้อมูลที่ไม่ครบ', () => {
  assert.equal(core.missionScore('producer', [0, 0]), 4);
  assert.equal(core.missionScore('producer', [2, 1]), 0);
  assert.equal(core.missionScore('producer', [0]), 2);
  assert.equal(core.missionScore('unknown', [0, 0]), 0);
});

test('ต้นทุนเดือนแรกคิดสี่คาบ ค่าเพิ่ม และเดินทางสี่ครั้ง', () => {
  const teacher = core.providers.find(p => p.id === 'a');
  assert.equal(core.monthlyTotal(teacher), 2600);
});

test('การจับคู่ใช้เงื่อนไขที่เลือกจริงและติดป้ายเกินงบ', () => {
  const localWithLoan = core.matchProviders({role:'performer', mode:'onsite', needLoan:true, budget:2000});
  assert.deepEqual(localWithLoan.map(p => p.id), ['c', 'a']);
  assert.equal(localWithLoan[0].overBudget, false);
  assert.equal(localWithLoan[1].overBudget, true);
  assert.deepEqual(core.matchProviders({role:'producer', mode:'onsite'}), []);
});
