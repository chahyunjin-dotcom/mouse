/* Physical-key-code based Korean Dubeolsik trainer: works in either OS input language. */
const KEYS = [
  ['Q','ㅂ','ㅃ','lp'],['W','ㅈ','ㅉ','lr'],['E','ㄷ','ㄸ','lm'],['R','ㄱ','ㄲ','li'],['T','ㅅ','ㅆ','li'],
  ['Y','ㅛ',null,'ri'],['U','ㅕ',null,'ri'],['I','ㅑ',null,'rm'],['O','ㅐ','ㅒ','rr'],['P','ㅔ','ㅖ','rp'],
  ['A','ㅁ',null,'lp'],['S','ㄴ',null,'lr'],['D','ㅇ',null,'lm'],['F','ㄹ',null,'li'],['G','ㅎ',null,'li'],
  ['H','ㅗ',null,'ri'],['J','ㅓ',null,'ri'],['K','ㅏ',null,'rm'],['L','ㅣ',null,'rr'],[';',';',null,'rp'],
  ['Z','ㅋ',null,'lp'],['X','ㅌ',null,'lr'],['C','ㅊ',null,'lm'],['V','ㅍ',null,'li'],['B','ㅠ',null,'li'],
  ['N','ㅜ',null,'ri'],['M','ㅡ',null,'ri']
].map(([latin,hangul,shifted,finger])=>({latin,hangul,shifted,finger,code:latin===';'?'Semicolon':`Key${latin}`}));
const keyByCode = new Map(KEYS.map(key=>[key.code,key]));
// 받침이 없는 친숙한 낱말. 각 음절은 초성+모성 두 글쇠로 완성된다.
const WORDS = [
  {word:'나무',emoji:'🌳',letters:'SKAN'},
  {word:'바다',emoji:'🌊',letters:'QKEK'},
  {word:'아기',emoji:'👶',letters:'DKRL'},
  {word:'모자',emoji:'🧢',letters:'AHWK'},
  {word:'우유',emoji:'🥛',letters:'DNDB'},
  {word:'고기',emoji:'🍖',letters:'RHRL'},
  {word:'오리',emoji:'🦆',letters:'DHFL'},
  {word:'포도',emoji:'🍇',letters:'VHEH'},
  {word:'하마',emoji:'🦛',letters:'GKAK'},
  {word:'기차',emoji:'🚂',letters:'RLCK'}
].map(item=>({...item,codes:[...item.letters].map(letter=>`Key${letter}`)}));
const WORD_REPEATS = 2;
const WORD_STROKES = WORDS[0].codes.length;
const LEVELS = [
  {id:'home',label:'기본 자리',description:'손가락의 집을 찾아요',icon:'🏠',keys:'ASDFJKL;GH'.split('')},
  {id:'top',label:'윗줄 자리',description:'위쪽으로 손가락 쭉!',icon:'☁️',keys:'QWERTYUIOP'.split('')},
  {id:'bottom',label:'아랫줄 자리',description:'아래쪽으로 톡톡!',icon:'🌱',keys:'ZXCVBNM'.split('')},
  {id:'shift',label:'Shift 쌍자음',description:'ㄲ ㄸ ㅃ ㅆ ㅉ · ㅒ ㅖ',icon:'✨',keys:'REQTWOP'.split(''),shift:true},
  {id:'words',label:'단어 연습',description:'받침 없는 단어 10개',icon:'🧩',wordMode:true}
];
const FINGERS = {lp:'왼손 새끼손가락',lr:'왼손 약지',lm:'왼손 중지',li:'왼손 검지',ri:'오른손 검지',rm:'오른손 중지',rr:'오른손 약지',rp:'오른손 새끼손가락'};
const HINT_NAMES={lp:'새끼',lr:'약지',lm:'중지',li:'검지',ri:'검지',rm:'중지',rr:'약지',rp:'새끼'};
const STORAGE='toktok-hangul-keyboard-v1';
const levelTotal=index=>LEVELS[index].wordMode?WORDS.length*WORD_REPEATS*WORD_STROKES:LEVELS[index].keys.length*5;
let store={level:0,progress:[0,0,0,0,0],sound:true};
try {const saved=JSON.parse(localStorage.getItem(STORAGE)||'null');if(saved&&Array.isArray(saved.progress)){store={level:Math.min(LEVELS.length-1,Math.max(0,Number(saved.level)||0)),progress:LEVELS.map((l,i)=>Math.min(levelTotal(i),Math.max(0,Number(saved.progress[i])||0))),sound:saved.sound!==false}}}catch{}
let pressedCodes=new Set(),virtualShift=false,lastWrong=null,feedbackTimeout=null,audioContext=null;
const $=id=>document.getElementById(id);
const currentLevel=()=>LEVELS[store.level];
const levelKeys=level=>level.keys.map(c=>KEYS.find(k=>k.latin===c));
const currentWordIndex=()=>Math.min(WORDS.length-1,Math.floor(store.progress[4]/(WORD_REPEATS*WORD_STROKES)));
const currentWord=()=>WORDS[currentWordIndex()];
const currentWordKeyIndex=()=>Math.floor(store.progress[4]%WORD_STROKES);
const currentTarget=()=>currentLevel().wordMode
  ? keyByCode.get(currentWord().codes[currentWordKeyIndex()])
  : levelKeys(currentLevel())[Math.min(Math.floor(store.progress[store.level]/5),currentLevel().keys.length-1)];
const levelComplete=index=>store.progress[index]>=levelTotal(index);
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(store))}catch{}}

function makeLessonTabs(){
  $('lessonTabs').innerHTML=LEVELS.map((level,i)=>`<button type="button" class="lesson-tab" role="tab" aria-selected="${i===store.level}" aria-controls="keyboard" data-level="${i}"><span class="lesson-icon">${level.icon}</span><span class="lesson-copy"><small>STEP ${String(i+1).padStart(2,'0')}</small><strong>${level.label}</strong><em>${level.description}</em></span>${levelComplete(i)?'<span class="done-icon" aria-label="완료">✓</span>':''}</button>`).join('');
  $('lessonTabs').querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>switchLevel(Number(button.dataset.level))));
}
function makeKeyboard(){
  const rows=[KEYS.slice(0,10),KEYS.slice(10,20),KEYS.slice(20,27)];
  function keyHTML(key){return `<button type="button" class="keycap" data-code="${key.code}" aria-label="${key.hangul} ${key.latin} 키"><span class="latin">${key.latin}</span>${key.shifted?`<span class="shifted-character">${key.shifted}</span>`:''}<span class="hangul">${key.hangul}</span></button>`}
  $('keyboard').innerHTML=rows.map((row,index)=>`<div class="keyboard-row ${index===2?'bottom-row':''}">${index===2?'<button type="button" class="keycap shift-key" data-code="ShiftLeft" aria-label="왼쪽 쉬프트 키"><span class="hangul">⇧ Shift</span></button>':''}${row.map(keyHTML).join('')}${index===2?'<button type="button" class="keycap shift-key" data-code="ShiftRight" aria-label="오른쪽 쉬프트 키"><span class="hangul">Shift ⇧</span></button>':''}</div>`).join('')+'<div class="keyboard-row space-row"><button type="button" class="keycap space-key" tabindex="-1" disabled aria-hidden="true"></button></div>';
  $('keyboard').querySelectorAll('button[data-code]').forEach(button=>button.addEventListener('click',()=>{
    const code=button.dataset.code;
    if(code.startsWith('Shift')){virtualShift=!virtualShift;renderKeyboard();setFeedback(virtualShift?'⇧ Shift가 켜졌어요! 이제 글쇠를 눌러요.':'Shift를 껐어요.');return;}
    handleAttempt(code,virtualShift);if(virtualShift){virtualShift=false;renderKeyboard();}
  }));
}
function makeHands(){
  function handHTML(side){let list=side==='left'?['lp','lr','lm','li']:['ri','rm','rr','rp'];return `<div class="hand ${side}"><div class="hand-fingers">${list.map((id,i)=>`<div class="finger finger-${i}" data-finger="${id}" aria-label="${FINGERS[id]}"><b></b></div>`).join('')}</div><div class="hand-palm">${side==='left'?'왼손':'오른손'}</div><div class="thumb"></div></div>`}
  $('hands').innerHTML=handHTML('left')+handHTML('right');
}
function renderKeyboard(){
  const target=currentTarget(),level=currentLevel();
  const activeLetters=level.wordMode?[...currentWord().letters]:level.keys;
  document.querySelectorAll('.keycap[data-code]').forEach(button=>{
    const code=button.dataset.code,isShift=code.startsWith('Shift'),key=keyByCode.get(code);
    const home='ASDFJKL;'.includes(key?.latin||'§');
    const requiredShift=level.shift&&(target.finger.startsWith('l')?code==='ShiftRight':code==='ShiftLeft');
    button.classList.toggle('home',!isShift&&home);
    button.classList.toggle('target',!isShift&&code===target.code&&!levelComplete(store.level));
    button.classList.toggle('needed',Boolean(requiredShift&&!levelComplete(store.level)));
    button.classList.toggle('pressed',pressedCodes.has(code)||(isShift&&virtualShift));
    button.classList.toggle('wrong-press',lastWrong===code);
    button.classList.toggle('inactive-key',!isShift&&!activeLetters.includes(key?.latin));
    button.setAttribute('aria-pressed',String(!isShift?code===target.code:virtualShift));
  });
  const fingersToLight=[target.finger];if(level.shift)fingersToLight.push(target.finger.startsWith('l')?'rp':'lp');
  document.querySelectorAll('.finger').forEach(el=>el.classList.toggle('active-finger',fingersToLight.includes(el.dataset.finger)));
}
function renderWordProgress(){
  const progress=store.progress[4],complete=levelComplete(4),word=currentWord();
  const wordIndex=currentWordIndex(),withinWord=progress%(WORD_REPEATS*WORD_STROKES);
  const typedKeys=complete?WORD_STROKES:withinWord%WORD_STROKES;
  const syllables=[...word.word];
  $('writingSyllables').innerHTML=syllables.map((syllable,i)=>{
    const start=i*2;
    const text=typedKeys>=start+2?syllable:typedKeys===start+1?keyByCode.get(word.codes[start]).hangul:'·';
    return `<span class="writing-syllable ${typedKeys>=start+2?'done':''} ${typedKeys===start+1?'partial':''}">${text}</span>`;
  }).join('');
  $('wordListCount').textContent=`${Math.floor(progress/WORD_STROKES)} / ${WORDS.length*WORD_REPEATS}번 완성`;
  $('wordList').innerHTML=WORDS.map((item,i)=>{
    const completed=i<wordIndex||complete?2:i===wordIndex?Math.floor(withinWord/WORD_STROKES):0;
    return `<div class="word-chip ${i===wordIndex&&!complete?'current':''} ${completed===2?'done':''}"><span class="word-chip-emoji">${item.emoji}</span><strong>${item.word}</strong><span class="word-chip-stars" aria-label="${completed}번 완성">${'★'.repeat(completed)}${'☆'.repeat(WORD_REPEATS-completed)}</span></div>`;
  }).join('');
}
function render(){
  const level=currentLevel(),progress=store.progress[store.level],target=currentTarget(),count=progress%5;
  const complete=levelComplete(store.level),isWord=Boolean(level.wordMode);
  makeLessonTabs();
  $('wordWriting').hidden=!isWord;$('wordListCard').hidden=!isWord;
  $('currentPanelTitle').textContent=isWord?'오늘의 단어':'오늘의 글쇠';
  $('counterTitle').textContent=isWord?'단어를 2번 완성해요!':'5번 톡톡!';
  $('stepBadge').textContent=isWord?`${currentWordIndex()+1} / ${WORDS.length}`:`${Math.min(level.keys.length,Math.floor(progress/5)+1)} / ${level.keys.length}`;
  $('targetSubtitle').textContent=complete?'참 잘했어요!':isWord?'단어를 보고 차례차례 눌러요!':'이 글쇠를 눌러 보세요!';
  $('targetKey').textContent=complete?'✓':isWord?`${currentWord().emoji} ${currentWord().word}`:level.shift?target.shifted:target.hangul;
  $('targetKey').classList.toggle('shift-target',!!level.shift);
  $('targetKey').classList.toggle('word-target',isWord);
  $('targetLatin').textContent=complete?'이 단계의 연습을 모두 마쳤어요!':isWord?'아래에 글자가 하나씩 완성돼요':level.shift?`Shift + ${target.latin} 키`:`${target.latin} 키`;
  const repeatDone=isWord?(complete?WORD_REPEATS:Math.floor((progress%(WORD_REPEATS*WORD_STROKES))/WORD_STROKES)):(complete?5:count);
  const repeatTotal=isWord?WORD_REPEATS:5;
  $('countLabel').textContent=`${repeatDone} / ${repeatTotal}`;
  $('stamps').innerHTML=Array.from({length:repeatTotal},(_,i)=>`<span class="stamp ${i<repeatDone?'filled':''}" aria-label="${i+1}번째 ${i<repeatDone?'성공':'미완료'}">${i<repeatDone?'★':'☆'}</span>`).join('');
  $('hintIcon').textContent=level.shift?'⇧':'☝️';
  $('fingerHint').textContent=complete?'최고의 타자왕!':FINGERS[target.finger];
  $('shiftHint').textContent=isWord?`다음 글쇠: ${target.hangul} (${target.latin}) · 글자 만들기`:level.shift?(target.finger.startsWith('l')?'오른쪽 새끼손가락으로 Shift를 함께 눌러요.':'왼쪽 새끼손가락으로 Shift를 함께 눌러요.'):'다른 손가락은 기본 자리에 놓아요.';
  $('keyboardInstruction').textContent=isWord?'받침 없는 단어를 한 글자씩 완성해요. 노란 키를 순서대로 누르면 됩니다.':level.shift?'초록색 Shift를 누른 채 노란색 글쇠를 눌러요. 화면 Shift는 한 번 눌러 켤 수도 있어요.':'노랗게 반짝이는 글쇠를 찾아 눌러요. 아래 손가락 그림도 함께 보세요.';
  if(isWord)renderWordProgress();
  const done=LEVELS.reduce((sum,l,i)=>sum+store.progress[i],0),total=LEVELS.reduce((sum,l,i)=>sum+levelTotal(i),0),percent=Math.round(done/total*100);
  $('overallLabel').textContent=`전체 연습 ${percent}%`;$('overallFill').style.width=`${percent}%`;
  $('soundToggle').innerHTML=store.sound?'🔊 <span class="hide-on-small">소리 켜짐</span>':'🔇 <span class="hide-on-small">소리 꺼짐</span>';
  $('soundToggle').setAttribute('aria-label',store.sound?'소리 끄기':'소리 켜기');
  renderKeyboard();
}
function setFeedback(message,type=''){clearTimeout(feedbackTimeout);const el=$('feedback');el.textContent=message;el.className='feedback '+type;if(type){feedbackTimeout=setTimeout(()=>{el.className='feedback'},2200)}}
function playTone(success=true){if(!store.sound)return;try{audioContext=audioContext||new(window.AudioContext||window.webkitAudioContext)();const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),start=audioContext.currentTime;oscillator.type='sine';oscillator.frequency.setValueAtTime(success?620:220,start);if(success)oscillator.frequency.exponentialRampToValueAtTime(850,start+.11);gain.gain.setValueAtTime(.07,start);gain.gain.exponentialRampToValueAtTime(.001,start+.16);oscillator.connect(gain).connect(audioContext.destination);oscillator.start(start);oscillator.stop(start+.17)}catch{}}
function switchLevel(index){store.level=index;virtualShift=false;save();render();setFeedback(levelComplete(index)?'이 단계는 이미 다 연습했어요! 🎉':'새로운 단계예요. 천천히 시작해요! 😊');$('finishOverlay').hidden=true}
function confetti(){const colors=['#ffd86c','#85dfbd','#ffb4a4','#a8beff','#d7adf2'];for(let i=0;i<45;i++){const piece=document.createElement('span');piece.className='confetti-piece';piece.style.background=colors[i%colors.length];piece.style.width=(5+Math.random()*8)+'px';piece.style.height=(8+Math.random()*9)+'px';piece.style.left=(15+Math.random()*70)+'vw';piece.style.top=(10+Math.random()*35)+'vh';piece.style.setProperty('--dx',(Math.random()-.5)*650+'px');piece.style.setProperty('--dy',(200+Math.random()*440)+'px');document.body.append(piece);setTimeout(()=>piece.remove(),1800)}}
function showFinished(){
  const last=store.level===LEVELS.length-1;
  $('finishTitle').textContent=last?'단어 타자왕 탄생!':'정말 멋져요!';
  $('finishMessage').textContent=last?'받침 없는 단어 10개를 모두 두 번씩 완성했어요! 정말 대단해요!':`${currentLevel().label} 연습을 모두 마쳤어요! 다음 단계도 도전해 볼까요?`;
  $('nextLesson').textContent=last?'첫 단계 다시 보기 ↻':'다음 단계로 가기 →';
  $('finishOverlay').hidden=false;confetti();
}
function handleAttempt(code,hasShift){
  if(!keyByCode.has(code)||!$('finishOverlay').hidden)return;
  const level=currentLevel();
  if(levelComplete(store.level)){setFeedback('완료한 단계예요! 다른 단계를 선택해 볼까요? 😊');return}
  const target=currentTarget(),wordBefore=level.wordMode?currentWord():null;
  const success=code===target.code&&Boolean(hasShift)===Boolean(level.shift);
  lastWrong=null;
  if(success){
    store.progress[store.level]++;save();playTone();render();
    const currentProgress=store.progress[store.level];
    if(levelComplete(store.level)){
      setFeedback('와! 이 단계를 모두 성공했어요! 🎉','success');setTimeout(showFinished,300);
    }else if(level.wordMode&&currentProgress%WORD_STROKES===0){
      const repeatNumber=Math.floor((currentProgress-1)% (WORD_STROKES*WORD_REPEATS)/WORD_STROKES)+1;
      setFeedback(repeatNumber===1?`${wordBefore.emoji} ${wordBefore.word} 첫 번째 성공! 한 번 더! ⭐`:`${wordBefore.emoji} ${wordBefore.word} 두 번 성공! 다음 단어로! 🌟`,'success');
    }else if(!level.wordMode&&currentProgress%5===0){
      setFeedback(`멋져요! ${target.shifted&&level.shift?target.shifted:target.hangul} 5번 성공! 다음 글쇠로! 🌟`,'success');
    }else{
      setFeedback(['좋아요! 👍','정확해요! ⭐','잘하고 있어요! 🌼','대단해요! ✨'][(currentProgress-1)%4],'success');
    }
  }else{
    lastWrong=code;renderKeyboard();setTimeout(()=>{lastWrong=null;renderKeyboard()},300);playTone(false);
    const result=level.shift&&!hasShift?'Shift도 함께 눌러야 해요!':!level.shift&&hasShift?'이번에는 Shift 없이 눌러요!':'괜찮아요! 반짝이는 글쇠를 다시 찾아요. 😊';
    setFeedback(result,'error');const el=$('targetKey');el.classList.remove('key-shake');void el.offsetWidth;el.classList.add('key-shake');
  }
}
function handleKeyDown(event){if(event.ctrlKey||event.altKey||event.metaKey||event.repeat)return;const {code}=event;if(code.startsWith('Shift')){pressedCodes.add(code);renderKeyboard();return}if(!keyByCode.has(code))return;if(event.target instanceof HTMLElement&&['INPUT','TEXTAREA'].includes(event.target.tagName))return;event.preventDefault();pressedCodes.add(code);handleAttempt(code,event.shiftKey||virtualShift);renderKeyboard()}
function handleKeyUp(event){pressedCodes.delete(event.code);renderKeyboard()}
function init(){makeKeyboard();makeHands();render();setFeedback('준비됐나요? 키보드를 눌러 보세요! 😊');window.addEventListener('keydown',handleKeyDown);window.addEventListener('keyup',handleKeyUp);window.addEventListener('blur',()=>{pressedCodes.clear();renderKeyboard()});$('restartLesson').addEventListener('click',()=>{store.progress[store.level]=0;virtualShift=false;save();render();setFeedback('다시 시작! 할 수 있어요! 💪')});$('soundToggle').addEventListener('click',()=>{store.sound=!store.sound;save();render()});$('nextLesson').addEventListener('click',()=>switchLevel((store.level+1)%LEVELS.length));$('closeFinish').addEventListener('click',()=>{$('finishOverlay').hidden=true});$('finishOverlay').addEventListener('click',event=>{if(event.target===$('finishOverlay'))$('finishOverlay').hidden=true});}
init();
