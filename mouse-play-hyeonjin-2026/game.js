/* 반짝반짝 마우스 놀이터 — 모든 게임은 브라우저 안에서만 실행됩니다. */
(() => {
  'use strict';

  const levels = [
    { id: 'click', title: '별을 콕콕!', icon: '⭐', skill: '한 번 클릭 연습', count: 8, instruction: '반짝이는 별을 마우스 왼쪽 버튼으로 콕 눌러봐요!', tip: '💡 마우스 화살표를 별에 올리고 왼쪽 버튼을 딱 한 번 눌러요.' },
    { id: 'double', title: '선물 상자 톡톡!', icon: '🎁', skill: '더블클릭 연습', count: 6, instruction: '같은 선물 상자를 빠르게 두 번 눌러서 열어봐요!', tip: '💡 마우스가 움직이지 않도록 잡고 “딸깍, 딸깍!” 해보세요.' },
    { id: 'drag', title: '로봇 간식 배달!', icon: '🤖', skill: '드래그 앤 드롭 연습', count: 6, instruction: '간식을 꾹 누른 채 로봇의 간식 상자로 옮겨요!', tip: '💡 누르기 → 계속 누른 채 움직이기 → 상자 안에서 손 떼기!' },
    { id: 'balloon', title: '풍선 팡팡!', icon: '🎈', skill: '움직이는 목표 클릭 연습', count: 12, instruction: '둥실둥실 떠 있는 풍선을 클릭해서 터뜨려요!', tip: '💡 풍선은 살짝 움직여요. 천천히 잘 보고 클릭하면 돼요.' },
    { id: 'shift', title: 'Shift + 클릭', icon: '⬆️', skill: 'Shift 키와 마우스 함께 쓰기', count: 4, instruction: 'Shift 키를 꾹 누른 상태에서 별을 마우스로 클릭해요!', tip: '💡 Shift는 글자 키 아래 왼쪽과 오른쪽에 있어요. 한 손으로 누르고 다른 손으로 클릭!' },
    { id: 'alt', title: 'Alt + 클릭', icon: '🎹', skill: 'Alt 키와 마우스 함께 쓰기', count: 4, instruction: 'Alt 키를 꾹 누른 상태에서 별을 마우스로 클릭해요!', tip: '💡 Alt는 스페이스바 양옆에 있어요. 손을 떼지 않고 별을 클릭해요!' },
    { id: 'ctrl', title: 'Ctrl + 클릭', icon: '🎹', skill: 'Ctrl 키와 마우스 함께 쓰기', count: 4, instruction: 'Ctrl 키를 꾹 누른 상태에서 별을 마우스로 클릭해요!', tip: '💡 Ctrl은 키보드 맨 아래 양쪽 끝에 있어요.' },
    { id: 'space', title: 'Space + 클릭', icon: '▭', skill: '스페이스바와 마우스 함께 쓰기', count: 4, instruction: '긴 스페이스바를 꾹 누른 상태에서 별을 클릭해요!', tip: '💡 스페이스바는 키보드 아래쪽 가운데 있는 가장 긴 키예요.' },
    { id: 'enter', title: 'Enter + 클릭', icon: '↵', skill: 'Enter 키와 마우스 함께 쓰기', count: 4, instruction: 'Enter 키를 꾹 누른 상태에서 별을 마우스로 클릭해요!', tip: '💡 Enter는 글자 키 오른쪽에 있어요. ↵ 표시를 찾아보세요!' }
  ];

  const $ = (id) => document.getElementById(id);
  const home = $('home');
  const play = $('play');
  const board = $('game-board');
  const successModal = $('success-modal');
  const helpModal = $('help-modal');
  const completed = new Set();
  let current = null;
  let progress = 0;
  let soundEnabled = true;
  let audioContext = null;
  let toastTimer = null;
  let round = 0;
  const keyboardPressed = new Set();

  const comboInfo = {
    shift: { name: 'Shift', read: '쉬프트', location: '글자 키 아래쪽 양옆', explanation: '대문자를 쓰거나 여러 항목을 선택할 때 사용하는 키예요.' },
    alt: { name: 'Alt', read: '알트', location: '스페이스바 바로 양옆', explanation: '다른 키와 조합하여 여러 기능을 실행할 때 사용해요.' },
    ctrl: { name: 'Ctrl', read: '컨트롤', location: '키보드 맨 아래 양쪽 끝', explanation: '복사(Ctrl+C) 같은 단축키에서 자주 만나게 돼요.' },
    space: { name: 'Space', read: '스페이스바', location: '아래쪽 가운데 길쭉한 키', explanation: '글자 사이를 띄울 때 사용하는 가장 긴 키예요.' },
    enter: { name: '↵ Enter', read: '엔터', location: '글자 키 오른쪽', explanation: '줄을 바꾸거나 입력을 마칠 때 사용하는 키예요.' }
  };

  const keyboardRows = [
    [['Q'],['W'],['E'],['R'],['T'],['Y'],['U'],['I'],['O'],['P'],['⌫']],
    [['A'],['S'],['D'],['F'],['G'],['H'],['J'],['K'],['L'],['↵ Enter','enter','medium']],
    [['Shift','shift','medium'],['Z'],['X'],['C'],['V'],['B'],['N'],['M'],['Shift','shift','medium']],
    [['Ctrl','ctrl'],['Win'],['Alt','alt'],['Space','space','long'],['Alt','alt'],['Win'],['Ctrl','ctrl']]
  ];

  const starSpots = [
    [50, 55], [22, 36], [77, 68], [69, 31], [33, 73], [84, 39], [17, 66], [52, 39]
  ];
  const gifts = ['🐰', '🐻', '🦊', '🐼', '🐸', '🐨'];
  const snacks = ['🍎', '🍌', '🍓', '🍪', '🍇', '🥕'];
  const balloonColors = ['#ff8b9c', '#ffcd6b', '#9c8cf2', '#79d8bf', '#80bff5', '#ffa874'];
  const balloonSpots = [[15, 32], [33, 58], [50, 31], [68, 58], [85, 31]];

  function beep(frequency = 570, seconds = .12, type = 'sine') {
    if (!soundEnabled) return;
    try {
      audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, audioContext.currentTime);
      gain.gain.setValueAtTime(.06, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + seconds);
      osc.connect(gain).connect(audioContext.destination);
      osc.start();
      osc.stop(audioContext.currentTime + seconds);
    } catch { /* Sound is optional. */ }
  }

  function praise() {
    const messages = ['멋져요! 🌟', '정말 잘했어요! 💜', '좋아요! 👍', '최고예요! ✨', '한 번 더 해볼까요? 🐭'];
    showToast(messages[Math.floor(Math.random() * messages.length)]);
    beep(610 + progress * 25);
  }

  function showToast(message) {
    const toast = $('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1250);
  }

  function decorate() {
    board.insertAdjacentHTML('beforeend', '<span class="board-decor one" aria-hidden="true">✦</span><span class="board-decor two" aria-hidden="true">✳</span>');
  }

  function updateHome() {
    $('total-stars').textContent = `⭐ ${completed.size * 3} / ${levels.length * 3}`;
    document.querySelectorAll('.game-card').forEach(card => {
      card.classList.toggle('done', completed.has(card.dataset.game));
      card.setAttribute('aria-label', `${card.querySelector('.card-title').textContent}${completed.has(card.dataset.game) ? ', 완료' : ''}`);
    });
  }

  function showHome() {
    round++;
    current = null;
    keyboardPressed.clear();
    successModal.classList.add('hidden');
    helpModal.classList.add('hidden');
    play.classList.add('hidden');
    home.classList.remove('hidden');
    updateHome();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setProgress(n) {
    progress = n;
    const total = current.count;
    $('progress-label').textContent = `${n} / ${total} 성공`;
    $('progress-fill').style.width = `${n / total * 100}%`;
    $('progress-bar').setAttribute('aria-valuemax', String(total));
    $('progress-bar').setAttribute('aria-valuenow', String(n));
    $('progress-stars').textContent = String(Math.floor(n / total * 3));
  }

  function startGame(id) {
    const level = levels.find(x => x.id === id);
    if (!level) return;
    round++;
    current = level;
    keyboardPressed.clear();
    successModal.classList.add('hidden');
    home.classList.add('hidden');
    play.classList.remove('hidden');
    $('play-count').textContent = `${levels.indexOf(level) + 1}번째 놀이`;
    $('game-title').textContent = level.title;
    $('game-icon').textContent = level.icon;
    $('game-skill').textContent = level.skill;
    $('game-instruction').textContent = level.instruction;
    $('game-tip').textContent = level.tip;
    board.className = 'game-board';
    board.replaceChildren();
    setProgress(0);
    if (id === 'click') setupClick();
    else if (id === 'double') setupDouble();
    else if (id === 'drag') setupDrag();
    else if (id === 'balloon') setupBalloons();
    else if (comboInfo[id]) setupKeyboardCombo();
    if (comboInfo[id]) board.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function succeed() {
    const levelId = current.id;
    const session = round;
    completed.add(levelId);
    updateHome();
    beep(750, .16);
    setTimeout(() => beep(980, .23), 140);
    setTimeout(() => {
      if (session !== round || !current || current.id !== levelId) return;
      const isFinal = completed.size === levels.length;
      $('success-emoji').textContent = isFinal ? '🏆' : '🎉';
      $('success-title').textContent = isFinal ? '키보드·마우스 박사 탄생!' : '우와! 참 잘했어요!';
      $('success-text').textContent = isFinal ? '아홉 가지 놀이를 모두 해냈어요! 손끝이 반짝반짝 ✨' : `“${current.title}” 미션 성공! 별 3개를 받았어요 ⭐⭐⭐`;
      const next = levels[(levels.indexOf(current) + 1) % levels.length];
      $('next-game').textContent = isFinal ? '🏠 처음 화면으로' : `${next.icon} 다음 놀이 하기 →`;
      successModal.classList.remove('hidden');
      $('next-game').focus();
    }, 640);
  }

  function addPoint() {
    const next = progress + 1;
    setProgress(next);
    praise();
    if (next >= current.count) succeed();
  }

  function sparkAt(x, y, symbol = '✨') {
    const rect = board.getBoundingClientRect();
    const spark = document.createElement('span');
    spark.className = 'tap-spark';
    spark.textContent = symbol;
    spark.style.left = `${x - rect.left}px`;
    spark.style.top = `${y - rect.top}px`;
    board.append(spark);
    setTimeout(() => spark.remove(), 550);
  }

  function setupClick() {
    decorate();
    board.insertAdjacentHTML('beforeend', '<div class="star-subtext">⭐ 반짝이는 별을 찾아봐!</div>');
    spawnStar();
  }

  function spawnStar() {
    const old = board.querySelector('.star-play');
    old?.remove();
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'star-play';
    button.textContent = '⭐';
    button.setAttribute('aria-label', '별 클릭하기');
    const [x, y] = starSpots[progress];
    button.style.left = `${x}%`;
    button.style.top = `${y}%`;
    button.addEventListener('click', e => {
      sparkAt(e.clientX, e.clientY, '🌟');
      button.remove();
      addPoint();
      if (progress < current.count) spawnStar();
    }, { once: true });
    board.append(button);
  }

  function setupDouble() {
    decorate();
    board.classList.add('gifts-stage');
    let lastId = null;
    let lastTime = 0;
    gifts.forEach((animal, index) => {
      const gift = document.createElement('button');
      gift.type = 'button';
      gift.className = 'gift';
      gift.setAttribute('aria-label', `${index + 1}번 선물 상자 더블클릭`);
      gift.innerHTML = '<span class="gift-pic">🎁</span><span class="gift-hint">두 번 톡톡!</span>';
      gift.addEventListener('click', () => {
        if (gift.classList.contains('opened')) return;
        const now = performance.now();
        if (lastId === index && now - lastTime < 670) {
          gift.classList.add('opened');
          gift.innerHTML = `<span class="gift-pic">${animal}</span><span class="gift-hint">열었다! ✓</span>`;
          gift.setAttribute('aria-label', `${index + 1}번 선물 상자 열림`);
          lastId = null;
          addPoint();
        } else {
          lastId = index;
          lastTime = now;
          gift.classList.remove('notice');
          void gift.offsetWidth;
          gift.classList.add('notice');
          gift.querySelector('.gift-hint').textContent = '한 번 더 빨리!';
          beep(400, .06);
        }
      });
      board.append(gift);
    });
    const instruction = document.createElement('div');
    instruction.className = 'tap-instruction';
    instruction.textContent = '🎁 같은 상자를 빠르게 두 번 클릭해요';
    board.append(instruction);
  }

  function setupDrag() {
    board.classList.add('drag-stage');
    board.innerHTML = `<div class="robot-area"><div class="big-robot" aria-hidden="true">🤖</div><div class="robot-target" id="robot-target"><strong>여기에 쏙! 📦</strong><small>간식 놓는 곳</small><div class="delivered-foods" id="delivered-foods"></div></div></div><div class="food-instruction">👇 아래 간식을 꾹 잡고 위로 옮겨요</div><div class="food-tray" id="food-tray"></div>`;
    const tray = $('food-tray');
    const target = $('robot-target');
    snacks.forEach((snack, i) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'food-item';
      item.textContent = snack;
      item.setAttribute('aria-label', `${snack} 간식 드래그`);
      item.dataset.index = i;
      let ghost = null;
      let dragging = false;

      const move = (e) => {
        if (!dragging || !ghost) return;
        ghost.style.left = `${e.clientX}px`;
        ghost.style.top = `${e.clientY}px`;
        const rect = target.getBoundingClientRect();
        target.classList.toggle('over', e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom);
      };

      const finish = (e, cancelled = false) => {
        if (!dragging) return;
        dragging = false;
        item.classList.remove('dragging');
        ghost?.remove();
        ghost = null;
        target.classList.remove('over');
        const rect = target.getBoundingClientRect();
        const inside = !cancelled && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
        if (inside) {
          item.classList.add('delivered');
          item.disabled = true;
          $('delivered-foods').append(document.createTextNode(snack));
          sparkAt(e.clientX, e.clientY, '💚');
          addPoint();
        } else if (!cancelled) {
          showToast('괜찮아요! 상자 안에 다시 놓아봐요 😊');
          beep(340, .08);
        }
      };

      item.addEventListener('pointerdown', e => {
        if (item.disabled || e.button !== 0) return;
        e.preventDefault();
        dragging = true;
        item.classList.add('dragging');
        item.setPointerCapture(e.pointerId);
        ghost = document.createElement('div');
        ghost.className = 'floating-food';
        ghost.textContent = snack;
        document.body.append(ghost);
        move(e);
      });
      item.addEventListener('pointermove', move);
      item.addEventListener('pointerup', e => finish(e));
      item.addEventListener('pointercancel', e => finish(e, true));
      tray.append(item);
    });
  }

  function setupBalloons() {
    board.classList.add('balloon-stage');
    board.innerHTML = '<div class="balloon-caption">🎈 풍선을 콕! 콕! 터뜨려요</div>';
    let spawned = 0;
    const makeBalloon = () => {
      if (spawned >= current.count) return;
      const index = spawned++;
      const [x, y] = balloonSpots[index % balloonSpots.length];
      const balloon = document.createElement('button');
      balloon.type = 'button';
      balloon.className = 'balloon';
      balloon.setAttribute('aria-label', '풍선 터뜨리기');
      balloon.style.left = `${x}%`;
      balloon.style.top = `${y}%`;
      balloon.style.setProperty('--balloon', balloonColors[index % balloonColors.length]);
      balloon.style.animationDelay = `${index * -.32}s`;
      balloon.innerHTML = '<span class="balloon-shape"></span><span class="balloon-string"></span>';
      balloon.addEventListener('click', e => {
        const rect = balloon.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        balloon.remove();
        const boardRect = board.getBoundingClientRect();
        const pop = document.createElement('span');
        pop.className = 'pop-ring';
        pop.style.left = `${centerX - boardRect.left}px`;
        pop.style.top = `${centerY - boardRect.top}px`;
        board.append(pop);
        setTimeout(() => pop.remove(), 450);
        sparkAt(centerX, centerY, '💥');
        addPoint();
        if (progress < current.count) makeBalloon();
      }, { once: true });
      board.append(balloon);
    };
    for (let i = 0; i < 5; i++) makeBalloon();
  }

  const comboSpots = [[19, 60], [79, 53], [48, 68], [65, 46]];

  function setupKeyboardCombo() {
    const keyId = current.id;
    const info = comboInfo[keyId];
    const keyboardHtml = keyboardRows.map(row => `<div class="keyboard-row">${row.map(([label, id, width]) => {
      const targetClass = id === keyId ? 'target' : '';
      const extraClass = width || '';
      return `<span class="kb-key ${targetClass} ${extraClass}" ${id === keyId ? 'data-target-key="true"' : ''}>${label}</span>`;
    }).join('')}</div>`).join('');

    board.classList.add('keyboard-stage');
    board.innerHTML = `
      <div class="combo-callout">🎯 오늘 찾을 키: ${info.read}!</div>
      <div class="combo-large-key"><kbd>${info.name}</kbd><span>꾹 누르고 <strong>+</strong> 별 클릭 🖱️</span></div>
      <div class="combo-status" id="combo-status" role="status">⌨️ 노란색 ${info.name} 키를 찾아 눌러봐요!</div>
      <div class="combo-target-zone" id="combo-target-zone" aria-label="키를 누른 채 별 클릭하기"></div>
      <div class="keyboard-guide-label">👇 실제 키보드에서 노란색 위치를 찾아보세요 · ${info.location}</div>
      <div class="keyboard-diagram" role="img" aria-label="키보드 위치 그림. ${info.read} 키는 ${info.location}에 노란색으로 표시되어 있어요.">${keyboardHtml}</div>
      <div class="keyboard-note">💡 <strong>${info.read}</strong>: ${info.explanation}</div>`;
    spawnComboTarget();
  }

  function updateComboHeld() {
    if (!current || !comboInfo[current.id]) return;
    const held = keyboardPressed.has(current.id);
    board.querySelectorAll('[data-target-key]').forEach(el => el.classList.toggle('held', held));
    const status = $('combo-status');
    if (!status) return;
    status.classList.toggle('key-is-down', held);
    status.textContent = held ? '🟢 좋아요! 키를 누른 채 별을 클릭해요!' : `⌨️ 노란색 ${comboInfo[current.id].name} 키를 찾아 눌러봐요!`;
  }

  function spawnComboTarget() {
    const zone = $('combo-target-zone');
    if (!zone || !current || !comboInfo[current.id]) return;
    zone.querySelector('.combo-target')?.remove();
    const [x, y] = comboSpots[progress];
    const target = document.createElement('button');
    target.type = 'button';
    target.className = 'combo-target';
    target.textContent = '⭐';
    target.style.left = `${x}%`;
    target.style.top = `${y}%`;
    target.setAttribute('aria-label', `${comboInfo[current.id].read} 키를 누른 채 별 클릭하기`);
    target.addEventListener('click', e => {
      // A key alone may synthesize a click on a focused button. A real mouse click
      // has detail > 0, so keyboard activation by itself cannot finish this task.
      if (e.detail === 0 || e.button !== 0) return;
      const id = current.id;
      const modifierMatch = id === 'shift' ? e.shiftKey : id === 'alt' ? e.altKey : id === 'ctrl' ? e.ctrlKey : true;
      // Browser-native modifier+click events reliably report shiftKey/altKey/
      // ctrlKey even when the browser consumes the corresponding keydown.
      // Space and Enter have no mouse-event modifier flags, so those games
      // must use the actual tracked keydown/keyup state.
      const keyIsHeld = ['shift', 'alt', 'ctrl'].includes(id) ? modifierMatch : keyboardPressed.has(id);
      if (!keyIsHeld) {
        showToast(`먼저 ${comboInfo[id].name} 키를 꾹 누른 채 클릭해요! 😊`);
        beep(330, .07);
        return;
      }
      const rect = target.getBoundingClientRect();
      sparkAt(rect.left + rect.width / 2, rect.top + rect.height / 2, '🌟');
      target.remove();
      addPoint();
      if (progress < current.count) spawnComboTarget();
    });
    zone.append(target);
  }

  function comboKey(e) {
    if (e.key === 'Shift') return 'shift';
    if (e.key === 'Alt') return 'alt';
    if (e.key === 'Control') return 'ctrl';
    if (e.code === 'Space' || e.key === ' ') return 'space';
    if (e.key === 'Enter') return 'enter';
    return null;
  }

  document.addEventListener('keydown', e => {
    if (!current || !comboInfo[current.id] || !successModal.classList.contains('hidden')) return;
    const key = comboKey(e);
    if (!key) return;
    // Space scrolls the page; Enter activates focused buttons; Alt can open a
    // browser menu. Prevent those defaults only within a keyboard mission.
    e.preventDefault();
    if (key === current.id) {
      keyboardPressed.add(key);
      updateComboHeld();
    }
  }, true);
  document.addEventListener('keyup', e => {
    const key = comboKey(e);
    if (!key || !current || !comboInfo[current.id]) return;
    e.preventDefault();
    keyboardPressed.delete(key);
    updateComboHeld();
  }, true);
  window.addEventListener('blur', () => {
    keyboardPressed.clear();
    updateComboHeld();
  });

  document.querySelectorAll('[data-game]').forEach(card => card.addEventListener('click', () => startGame(card.dataset.game)));
  $('start-first').addEventListener('click', () => startGame('click'));
  $('brand-home').addEventListener('click', showHome);
  $('back-home').addEventListener('click', showHome);
  $('to-home').addEventListener('click', showHome);
  $('retry-btn').addEventListener('click', () => current && startGame(current.id));
  $('next-game').addEventListener('click', () => {
    if (completed.size === levels.length) showHome();
    else startGame(levels[(levels.indexOf(current) + 1) % levels.length].id);
  });
  $('sound-btn').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    $('sound-btn').textContent = soundEnabled ? '🔊' : '🔇';
    $('sound-btn').setAttribute('aria-label', soundEnabled ? '소리 끄기' : '소리 켜기');
    if (soundEnabled) beep(660);
  });
  $('help-btn').addEventListener('click', () => helpModal.classList.remove('hidden'));
  $('close-help').addEventListener('click', () => helpModal.classList.add('hidden'));
  $('help-okay').addEventListener('click', () => helpModal.classList.add('hidden'));
  helpModal.addEventListener('click', e => { if (e.target === helpModal) helpModal.classList.add('hidden'); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!helpModal.classList.contains('hidden')) helpModal.classList.add('hidden');
      else if (!successModal.classList.contains('hidden')) showHome();
      else if (current) showHome();
    }
  });
  updateHome();
})();
