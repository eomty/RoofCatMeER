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
