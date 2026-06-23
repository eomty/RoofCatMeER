/* ===================================================================
   루프캣 방탈출 — 공용 타이머 시스템
   localStorage 키: rcm_timer
   =================================================================== */
(function(){
  var STORAGE_KEY = 'rcm_timer';
  var HINT3_UNLOCK_DELAY = 120; // 챕터 입장 후 2분
  var HINT_COSTS = [60, 120, 210]; // 힌트1,2,3 페널티(초): 1분/2분/3분30초
  var WRONG_ANSWER_PENALTY = 5; // 오답 1회당 페널티(초)
  var CHAPTER_ORDER = ['chapter1','chapter2','chapter3','chapter4','chapter5','chapter6','chapter7'];

  function loadState(){
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      var s = JSON.parse(raw);
      if (!s.chapters) s.chapters = {};
      return s;
    } catch(e){ return defaultState(); }
  }

  function defaultState(){
    return {
      gameStartedAt: null,
      gameEndedAt: null,
      finalElapsedSec: null,
      timerStopped: false,
      penaltySec: 0,
      hintCounts: {},
      wrongCounts: {},
      chapters: {},
      currentChapter: null,
      currentChapterEnteredAt: null
    };
  }

  function saveState(s){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch(e){}
  }

  var state = loadState();

  function nowMs(){ return Date.now(); }

  function ensureGameStarted(){
    if (!state.gameStartedAt) {
      state.gameStartedAt = nowMs();
      saveState(state);
    }
  }

  function enterChapter(chapterId){
    if (state.timerStopped) return;
    ensureGameStarted();
    if (state.currentChapter && state.currentChapter !== chapterId && state.currentChapterEnteredAt) {
      var spent = Math.round((nowMs() - state.currentChapterEnteredAt) / 1000);
      state.chapters[state.currentChapter] = (state.chapters[state.currentChapter] || 0) + spent;
    }
    state.currentChapter = chapterId;
    state.currentChapterEnteredAt = nowMs();
    saveState(state);
  }

  function addPenalty(sec){
    if (state.timerStopped) return;
    state.penaltySec = (state.penaltySec || 0) + sec;
    saveState(state);
  }

  function useHint(chapterId, hintIndex){
    if (state.timerStopped) return null;
    var key = chapterId + '_h' + hintIndex;
    if (state.hintCounts[key]) return null;
    state.hintCounts[key] = true;
    var cost = HINT_COSTS[hintIndex-1] || 0;
    addPenalty(cost);
    saveState(state);
    return cost;
  }

  function isHint3Unlocked(chapterId){
    if (!state.currentChapterEnteredAt || state.currentChapter !== chapterId) return false;
    var sinceEnter = (nowMs() - state.currentChapterEnteredAt) / 1000;
    return sinceEnter >= HINT3_UNLOCK_DELAY;
  }

  function hint3RemainingSec(chapterId){
    if (!state.currentChapterEnteredAt || state.currentChapter !== chapterId) return HINT3_UNLOCK_DELAY;
    var sinceEnter = (nowMs() - state.currentChapterEnteredAt) / 1000;
    return Math.max(0, Math.ceil(HINT3_UNLOCK_DELAY - sinceEnter));
  }

  function wrongAnswer(chapterId){
    if (state.timerStopped) return;
    state.wrongCounts[chapterId] = (state.wrongCounts[chapterId] || 0) + 1;
    addPenalty(WRONG_ANSWER_PENALTY);
  }

  function getElapsedSec(){
    if (!state.gameStartedAt) return 0;
    if (state.timerStopped && state.finalElapsedSec != null) return state.finalElapsedSec;
    var base = Math.round((nowMs() - state.gameStartedAt) / 1000);
    return base + (state.penaltySec || 0);
  }

  function stopTimer(){
    if (state.timerStopped) return;
    if (state.currentChapter && state.currentChapterEnteredAt) {
      var spent = Math.round((nowMs() - state.currentChapterEnteredAt) / 1000);
      state.chapters[state.currentChapter] = (state.chapters[state.currentChapter] || 0) + spent;
    }
    state.finalElapsedSec = getElapsedSec();
    state.gameEndedAt = nowMs();
    state.timerStopped = true;
    saveState(state);
    return state.finalElapsedSec;
  }

  function formatTime(sec){
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec/60), s = sec%60;
    return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  }

  function getRank(totalSec){
    var min = totalSec / 60;
    if (min <= 20) return {grade:'S', reward:'상품샵 이용권 (미정)'};
    if (min <= 30) return {grade:'A', reward:'고양이 간식'};
    if (min <= 40) return {grade:'B', reward:'음료수 2잔 티켓'};
    return {grade:'C', reward:'포토카드 1장'};
  }

  function getChapterBreakdown(){
    var list = [];
    CHAPTER_ORDER.forEach(function(id){
      list.push({ chapter: id, sec: state.chapters[id] || 0 });
    });
    return list;
  }

  function resetAll(){
    state = defaultState();
    saveState(state);
  }

  window.RCMTimer = {
    enterChapter: enterChapter,
    useHint: useHint,
    isHint3Unlocked: isHint3Unlocked,
    hint3RemainingSec: hint3RemainingSec,
    wrongAnswer: wrongAnswer,
    getElapsedSec: getElapsedSec,
    stopTimer: stopTimer,
    formatTime: formatTime,
    getRank: getRank,
    getChapterBreakdown: getChapterBreakdown,
    resetAll: resetAll,
    addPenalty: addPenalty,
    isStopped: function(){ return !!state.timerStopped; },
    HINT_COSTS: HINT_COSTS,
    WRONG_ANSWER_PENALTY: WRONG_ANSWER_PENALTY
  };
})();
