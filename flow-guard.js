/* ===================================================================
   루프캣 방탈출 — 진행 순서 잠금 (Flow Guard)

   역할: "이전 단계를 깨지 않으면 다음 페이지에 못 들어가게" 막는 것만 전담.
   시간/힌트/페널티(타이머 관련)는 timer.js가 따로 담당하므로 여긴 안 건드림.

   불러오는 순서 (중요, 위→아래로 실행됨):
     1. debug-config.js   (RCM_DEBUG_MODE 정의)
     2. flow-guard.js      (이 파일 — RCM_DEBUG_MODE를 참조함)
     3. timer.js           (시간/힌트 — flow-guard와 무관, 순서 안 중요)

   localStorage 키: rcm_flow_progress
   =================================================================== */
(function(){
  var STORAGE_KEY = 'rcm_flow_progress';

  // 전체 페이지 진행 순서. 디버그탭의 "다음 챕터로" 버튼도 이 배열을 그대로 가져다 씀.
  var FLOW = [
    'index.html','synopsis-story.html',
    'chapter1.html','chapter1-unlocked.html',
    'chapter2.html','chapter2-unlocked.html',
    'nkk-chat.html',
    'chapter3.html',
    'chapter4.html','chapter4-call.html','chapter4-unlocked.html',
    'chapter5.html','chapter5-unlocked.html',
    'chapter6.html','chapter6-unlocked.html',
    'chapter7.html','chapter7-call.html','chapter7-unlocked.html',
    'chapter8.html','chapter8-unlocked.html',
    'ending.html',
    'result.html',
    'ranking.html'
  ];

  function loadDone(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch(e){ return {}; }
  }
  function saveDone(d){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch(e){}
  }
  function currentFile(){
    return location.pathname.split('/').pop() || 'index.html';
  }

  // 각 페이지가 "여기까지 깼다"고 알려줄 때 호출.
  // 보통 인자 없이 호출(현재 파일을 스스로 인식)하지만, 다른 페이지를 거쳐서 완료되는
  // 경우(예: chapter2.html → ar.html에서 실제 완료됨)엔 파일명을 직접 넘겨줄 수 있음.
  function markComplete(filename){
    var done = loadDone();
    done[filename || currentFile()] = true;
    saveDone(done);
  }

  function isComplete(filename){
    var done = loadDone();
    return !!done[filename];
  }

  // 챕터 클리어 기록만 초기화 (소요시간/힌트 기록은 안 건드림 — 그건 RCMTimer.resetAll()의 역할)
  function resetProgress(){
    try { localStorage.removeItem(STORAGE_KEY); } catch(e){}
  }

  // 페이지 로드 즉시 실행: 이전 단계 안 깼으면 그 페이지로 돌려보냄.
  // (디버그 모드 여부와 무관하게 항상 적용 — 디버그탭 보이는 것과 잠금은 별개)
  function guard(){
    var cur = currentFile();
    var idx = FLOW.indexOf(cur);
    if (idx <= 0) return; // 첫 페이지거나 흐름에 없는 페이지면 통과
    var prev = FLOW[idx - 1];
    if (!isComplete(prev)) {
      location.href = prev;
    }
  }

  guard();

  window.RCMFlow = {
    FLOW: FLOW,
    markComplete: markComplete,
    isComplete: isComplete,
    resetProgress: resetProgress,
    currentFile: currentFile
  };
})();
