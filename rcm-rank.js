/**
 * rcm-rank.js — RoofCatMe 랭킹 모듈
 * timer.js(RCMTimer)가 모든 시간/패널티 추적을 담당하므로
 * 이 파일은 Firebase 저장/조회만 합니다.
 *
 * ★ DB_URL을 Firebase Realtime Database URL로 교체하세요.
 */

var RCMRank = (function () {

  // ★ 여기만 수정하세요
  var DB_URL = 'https://YOUR-PROJECT-default-rtdb.firebaseio.com';

  // localStorage에서 RCMTimer 내부 state 읽기
  function timerState() {
    try { return JSON.parse(localStorage.getItem('rcm_timer')) || {}; }
    catch (e) { return {}; }
  }

  return {

    /**
     * 클리어 시 호출 — RCMTimer 정지 후 Firebase 저장
     * chapter7-to-8.html 에서 호출
     */
    save: function (onDone) {
      var name     = sessionStorage.getItem('rcm_player_name') || '익명';
      var totalSec = RCMTimer.stopTimer(); // 패널티 포함 최종 시간

      if (!totalSec) {
        console.warn('[RCMRank] 타이머가 시작되지 않았습니다.');
        if (onDone) onDone(null);
        return;
      }

      var s = timerState();

      // 오답 총 횟수
      var wrongCounts = s.wrongCounts || {};
      var wrongCount  = Object.keys(wrongCounts).reduce(function (a, k) {
        return a + (wrongCounts[k] || 0);
      }, 0);
      var wrongPen = wrongCount * 5;

      // 힌트 패널티 = 전체 패널티 - 오답 패널티
      var penaltySec = s.penaltySec || 0;
      var hintPen    = Math.max(0, penaltySec - wrongPen);

      // 순수 플레이 시간
      var elapsedSec = totalSec - penaltySec;

      var record = {
        name:        name,
        elapsed_sec: elapsedSec,
        wrong_count: wrongCount,
        wrong_pen:   wrongPen,
        hint_pen:    hintPen,
        total_sec:   totalSec,
        date:        new Date().toISOString().slice(0, 10)
      };

      fetch(DB_URL + '/rankings.json', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(record)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          console.log('[RCMRank] 저장 완료', res);
          if (onDone) onDone(record);
        })
        .catch(function (err) {
          console.error('[RCMRank] 저장 실패', err);
          if (onDone) onDone(null);
        });
    },

    /**
     * 상위 랭킹 조회
     * @param {number}   limit     가져올 개수 (기본 20)
     * @param {function} callback  callback(records[])
     */
    getTop: function (limit, callback) {
      limit = limit || 20;
      var url = DB_URL + '/rankings.json'
        + '?orderBy="total_sec"&limitToFirst=' + limit;

      fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data) { callback([]); return; }
          var list = Object.values(data);
          list.sort(function (a, b) { return a.total_sec - b.total_sec; });
          callback(list);
        })
        .catch(function (err) {
          console.error('[RCMRank] 조회 실패', err);
          callback([]);
        });
    },

    // 시간 포맷 헬퍼 — "mm:ss" 형식
    fmt: function (sec) {
      sec = Math.max(0, Math.floor(sec));
      var m = Math.floor(sec / 60), s = sec % 60;
      return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    }
  };

})();
