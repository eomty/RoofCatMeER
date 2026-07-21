/* ===================================================================
   루프캣 방탈출 — 디버그 패널 (Debug Panel)

   역할: 디버그 메뉴(챕터 바로가기 + 리셋 버튼들)의 HTML을 스스로 만들어서
   페이지에 꽂아넣는 것만 전담. 22개 페이지는 이제
     <script src="debug-panel.js"></script>
   한 줄만 있으면 됨 — 버튼을 추가/삭제/수정하고 싶으면 이 파일 하나만 고치면
   22개 페이지에 전부 반영됨.

   불러오는 순서 (중요):
     1. debug-config.js  (RCM_DEBUG_MODE 정의)
     2. flow-guard.js     (RCM_DEBUG_MODE를 참조 + RCMFlow 제공)
     3. debug-panel.js    (이 파일 — 둘 다 참조함)
   =================================================================== */
(function(){
  if (typeof RCM_DEBUG_MODE !== 'undefined' && RCM_DEBUG_MODE === false) return;

  var isIndex = (location.pathname.split('/').pop() || 'index.html') === 'index.html';
  var bottomOffset = isIndex ? 80 : 16;

  // [파일명, 표시텍스트, 강조(★)여부]
  var LINKS = [
    ['synopsis-story.html', '시놉시스', false],
    ['chapter1.html', '챕터1 — 백설이의 락커', false],
    ['chapter1-unlocked.html', '챕터1 — 일기', false],
    ['chapter2.html', '챕터2 — 전설의 타짜', false],
    ['chapter2-unlocked.html', '챕터2 — 언락', false],
    ['nkk-chat.html', '낑깡이 대화', false],
    ['chapter3.html', '챕터3 — 캣력사무소 ★', true],
    ['chapter4.html', '챕터4 — 영업사무소 ★', true],
    ['chapter4-call.html', '챕터4 — 주파수 찾기', false],
    ['chapter4-unlocked.html', '챕터4 — 도청', false],
    ['chapter5.html', '챕터5 — 위험한 편지 ★', true],
    ['chapter5-unlocked.html', '챕터5 — 수상한 장부 ★', true],
    ['chapter6.html', '챕터6 — 딜리셔스 호텔의 밤 ★', true],
    ['chapter6-unlocked.html', '챕터6 — CCTV 확인', false],
    ['chapter7.html', '챕터7 — 완벽한 알리바이 ★', true],
    ['chapter7-call.html', '챕터7 — 해커 전화', false],
    ['chapter7-unlocked.html', '챕터7 — 페너의 폰', false],
    ['chapter8.html', '챕터8 — 최종담판 ★', true],
    ['chapter8-unlocked.html', '챕터8 — 담판 진행', false],
    ['ending.html', '엔딩 ★', true],
    ['result.html', '결과 페이지 ★', true],
    ['ranking.html', '랭킹', false],
  ];

  function linkRow(item){
    var href = item[0], label = item[1], starred = item[2];
    var theme = starred
      ? 'color:#c9a84c;background:rgba(201,168,76,.1);'
      : 'color:rgba(255,255,255,.6);background:rgba(255,255,255,.05);';
    return '<a href="javascript:void(0)" data-rcm-jump="' + href + '" style="' + theme +
      'font-size:12px;padding:6px 10px;border-radius:6px;text-decoration:none;display:block;">' +
      label + '</a>';
  }

  var panelHtml =
    '<div id="rcm-debug-panel" style="position:fixed;bottom:' + bottomOffset + 'px;right:16px;z-index:500;">' +
      '<details>' +
        '<summary style="background:rgba(0,0,0,.7);color:rgba(255,255,255,.4);font-size:11px;padding:6px 12px;border-radius:20px;cursor:pointer;list-style:none;border:1px solid rgba(255,255,255,.1);">🛠 디버그</summary>' +
        '<div style="background:rgba(0,0,0,.85);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:8px;margin-top:6px;display:flex;flex-direction:column;gap:6px;min-width:170px;max-height:60vh;overflow-y:auto;">' +
          LINKS.map(linkRow).join('') +
          '<div style="border-top:1px solid rgba(255,255,255,.15);margin:4px 0 2px;"></div>' +
          '<button id="rcm-debug-reset-timer" style="color:#ff9a9a;font-size:12px;padding:6px 10px;background:rgba(139,26,26,.18);border:1px solid rgba(139,26,26,.35);border-radius:6px;cursor:pointer;text-align:left;font-family:inherit;">⏱ 소요시간 초기화</button>' +
          '<button id="rcm-debug-reset-progress" style="color:#ffb366;font-size:12px;padding:6px 10px;background:rgba(160,90,20,.18);border:1px solid rgba(160,90,20,.35);border-radius:6px;cursor:pointer;text-align:left;font-family:inherit;">🔓 챕터 클리어 기록 초기화</button>' +
          '<button id="rcm-debug-next" style="color:#9ad8ff;font-size:12px;padding:6px 10px;background:rgba(40,100,160,.18);border:1px solid rgba(40,100,160,.35);border-radius:6px;cursor:pointer;text-align:left;font-family:inherit;">⏭ 다음 챕터로</button>' +
        '</div>' +
      '</details>' +
    '</div>';

  function resetTimer(){
    if (!confirm('소요시간/힌트/오답 기록을 전부 초기화할까요?')) return;
    try {
      if (window.RCMTimer && RCMTimer.resetAll) RCMTimer.resetAll();
      else localStorage.removeItem('rcm_timer');
    } catch(e){}
    location.reload();
  }

  function resetProgress(){
    if (!confirm('챕터 클리어 기록을 초기화할까요?\n(다음 페이지로 넘어갈 때 다시 막히게 됩니다)')) return;
    if (window.RCMFlow && RCMFlow.resetProgress) RCMFlow.resetProgress();
    location.reload();
  }

  // 디버그탭으로 특정 페이지에 점프할 때, 그 앞 단계까지 전부 완료 처리해서
  // 도착 페이지의 잠금 체크를 정당하게 통과시킨다.
  function jumpTo(targetFile){
    var FLOW = (window.RCMFlow && RCMFlow.FLOW) || [];
    var idx = FLOW.indexOf(targetFile);
    if (window.RCMFlow && RCMFlow.markComplete && idx > 0) {
      for (var i = 0; i < idx; i++) RCMFlow.markComplete(FLOW[i]);
    }
    location.href = targetFile;
  }

  function goNext(){
    var FLOW = (window.RCMFlow && RCMFlow.FLOW) || [];
    var cur = location.pathname.split('/').pop() || 'index.html';
    var idx = FLOW.indexOf(cur);
    if (idx === -1 || idx >= FLOW.length - 1) {
      alert('다음 챕터 정보를 찾을 수 없어요.');
      return;
    }
    jumpTo(FLOW[idx + 1]);
  }

  function mount(){
    var wrap = document.createElement('div');
    wrap.innerHTML = panelHtml;
    document.body.appendChild(wrap.firstChild);

    var links = document.querySelectorAll('[data-rcm-jump]');
    for (var i = 0; i < links.length; i++) {
      links[i].onclick = (function(target){
        return function(){ jumpTo(target); };
      })(links[i].getAttribute('data-rcm-jump'));
    }

    document.getElementById('rcm-debug-reset-timer').onclick = resetTimer;
    document.getElementById('rcm-debug-reset-progress').onclick = resetProgress;
    document.getElementById('rcm-debug-next').onclick = goNext;
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
