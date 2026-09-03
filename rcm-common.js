/**
 * rcm-common.js — RoofCatMe 공통 초기화
 */

/* ── 1. iOS 오디오 잠금 해제 ─────────────────────────────────────────
   공용 AudioContext를 전역(RCMAudioCtx)으로 저장해서 챕터별 재사용 가능
──────────────────────────────────────────────────────────────────── */
(function () {
  var unlocked = false;

  function unlockAudio() {
    if (unlocked) return;
    unlocked = true;

    try {
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        if (!window.RCMAudioCtx) {
          window.RCMAudioCtx = new AudioContextClass();
        }
        if (window.RCMAudioCtx.state === 'suspended') {
          window.RCMAudioCtx.resume().catch(function(){});
        }
        var buffer = window.RCMAudioCtx.createBuffer(1, 1, 22050);
        var source = window.RCMAudioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(window.RCMAudioCtx.destination);
        source.start(0);
      }
    } catch (e) {}
  }

  document.addEventListener('touchend', unlockAudio, { once: true, passive: true });
  document.addEventListener('click',    unlockAudio, { once: true });
})();

/* ── 2. "탐정님" → 플레이어 이름 교체 ───────────────────────────── */
(function () {
  var name = sessionStorage.getItem('rcm_player_name');
  if (!name) return;

  function replaceName(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.indexOf('탐정님') !== -1) {
        node.nodeValue = node.nodeValue.replace(/탐정님/g, name + '님');
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { replaceName(document.body); });
  } else {
    replaceName(document.body);
  }
})();

/* ── 3. 동일 요소 중복 탭 방지 ──────────────────────────────────────
   같은 버튼을 500ms 안에 다시 누른 경우만 차단
   서로 다른 버튼 연속 클릭, 빈 화면 탭 진행에는 영향 없음
──────────────────────────────────────────────────────────────────── */
(function () {
  var lastTarget = null;
  var lastTapTime = 0;
  var BLOCK_TIME = 500;

  document.addEventListener('click', function (e) {
    var target = e.target.closest(
      'button, a, input[type="button"], input[type="submit"], [role="button"]'
    );
    if (!target) return;

    var now = Date.now();
    if (target === lastTarget && now - lastTapTime < BLOCK_TIME) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    lastTarget = target;
    lastTapTime = now;
  }, true);
})();

/* ── 4. 스크롤 유도 화살표 ──────────────────────────────────────────
   페이지가 스크롤 가능할 때 하단에 화살표 + 안내 문구 표시
   스크롤 80px 넘으면 사라짐
   이미지/폰트 늦은 로딩 대비: window.load + 400ms 후 재확인
──────────────────────────────────────────────────────────────────── */
(function () {
  var hint = null;
  var hidden = false;

  function showHint() {
    if (hint || hidden) return;
    if (window.scrollY > 80) { hidden = true; return; }
    if (document.body.scrollHeight <= window.innerHeight + 40) return;

    var style = document.createElement('style');
    style.textContent = [
      '@keyframes rcm-bounce{',
        '0%,100%{transform:translateX(-50%) translateY(0)}',
        '50%{transform:translateX(-50%) translateY(6px)}',
      '}'
    ].join('');
    document.head.appendChild(style);

    hint = document.createElement('div');
    hint.id = 'rcm-scroll-hint';
    hint.innerHTML = '<span style="display:block;font-size:10px;letter-spacing:0.08em;margin-bottom:2px;">아래로 더 보기</span>&#8964;';
    hint.style.cssText = [
      'position:fixed',
      'bottom:70px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-size:20px',
      'color:rgba(201,168,76,0.55)',
      'pointer-events:none',
      'z-index:9000',
      'animation:rcm-bounce 1.4s ease-in-out infinite',
      'transition:opacity 0.4s',
      'user-select:none',
      'text-align:center',
      'line-height:1.2'
    ].join(';');
    document.body.appendChild(hint);

    window.addEventListener('scroll', function () {
      if (!hidden && window.scrollY > 80) {
        hidden = true;
        hint.style.opacity = '0';
        setTimeout(function () { if (hint) { hint.remove(); hint = null; } }, 400);
      }
    }, { passive: true });
  }

  // DOMContentLoaded 후 1차 확인
  function onReady() {
    setTimeout(showHint, 400);
  }

  // window.load 후 2차 확인 (이미지/폰트 늦게 로딩되는 경우 대비)
  window.addEventListener('load', function () {
    setTimeout(showHint, 400);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
