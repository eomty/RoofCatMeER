/**
 * rcm-common.js — RoofCatMe 공통 초기화
 * 모든 챕터 HTML에 포함됩니다.
 *
 * 담당:
 *  - sessionStorage의 이름으로 페이지 내 "탐정님" 텍스트 교체
 *  - iOS Safari 오디오 잠금 해제 (첫 터치 시 자동 처리)
 */

/* ── 1. iOS 오디오 잠금 해제 ─────────────────────────────────────────
   iOS는 사용자 터치 없이 audio.play()를 막음.
   첫 터치 때 Web Audio API 무음 버퍼 재생으로 가장 확실하게 해제.
   이후 모든 챕터의 new Audio() / Web Audio API 정상 작동.
──────────────────────────────────────────────────────────────────── */
(function () {
  var unlocked = false;

  function unlockAudio() {
    if (unlocked) return;
    unlocked = true;

    // 가장 확실한 방법: Web Audio API 무음 버퍼 재생
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var buf = ctx.createBuffer(1, 1, 22050);
      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch (e) {}

    // chapter4 AudioContext가 이미 생성되어 있으면 resume
    if (window.RCMAudioCtx) {
      if (RCMAudioCtx.state === 'suspended') RCMAudioCtx.resume();
    }

    // HTML5 Audio 추가 보험
    try { new Audio().play().catch(function(){}); } catch(e) {}
  }

  document.addEventListener('touchstart', unlockAudio, { once: true });
  document.addEventListener('click',      unlockAudio, { once: true });
})();

/* ── 2. "탐정님" → 플레이어 이름 교체 ───────────────────────────── */
(function () {
  var name = sessionStorage.getItem('rcm_player_name');
  if (!name) return;

  function replaceName(root) {
    var walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.indexOf('탐정님') !== -1) {
        node.nodeValue = node.nodeValue.replace(/탐정님/g, name + '님');
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      replaceName(document.body);
    });
  } else {
    replaceName(document.body);
  }
})();
