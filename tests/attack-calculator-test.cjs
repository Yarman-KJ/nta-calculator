const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
function element(value=''){
 return {value,checked:false,hidden:false,textContent:'',innerHTML:'',parentElement:{textContent:''},addEventListener(){}};
}
const ids={
 'attack-tile-time':element('12'),'attack-result':element(),'attack-condition-summary':element(),
 'attack-siege-master':element(),'attack-trebuchet-policy':element()
};
const formations=['tank','tank-bow','tank-trebuchet'].map(value=>Object.assign(element(),{value,parentElement:{textContent:value}}));
const context={document:{getElementById:id=>ids[id]||null,querySelectorAll:()=>formations},window:{}};
vm.runInNewContext(fs.readFileSync(require.resolve('../src/attack-calculator.js'),'utf8'),context);
const calc=context.window.NTAAttackCalculator;
assert.equal(calc.estimateDps('tank'),28/36);
assert.deepEqual(Array.from(calc.calculate(12,'tank')),[8,17,26,36,45]);
assert.deepEqual(Array.from(calc.calculate(33,'tank')),[24,50,75,101,127]);
assert.deepEqual(Array.from(calc.calculate(34,'tank')),[25,51,78,104,131]);
assert.deepEqual(Array.from(calc.calculate(51,'tank-bow')),[31,63,96,128,160]);
assert.deepEqual(Array.from(calc.calculate(51,'tank-trebuchet')),[75,153,231,309,387]);
assert.deepEqual(Array.from(calc.calculate(51,'tank-trebuchet',{trebuchet:true})),[96,196,296,396,496]);
assert.deepEqual(Array.from(calc.calculate(12,'tank',{siegeMaster:true})),[10,22,34,47,59]);
console.log('공타 계산 검증 통과: 7/9 기준식, 33초→24HP, 영상 역산, 정책 반영');
