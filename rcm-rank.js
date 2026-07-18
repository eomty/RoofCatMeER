/**
 * rcm-rank.js — RoofCatMe 랭킹 공통 모듈
 *
 * ★ 사용 전 아래 DB_URL 을 본인 Firebase Realtime Database URL로 교체하세요.
 *   예) https://roofcatme-default-rtdb.firebaseio.com
 */

var RCMRank = (function () {

  // ★ 여기만 수정하세요
  var DB_URL = 'https://roofcatmeer-default-rtdb.asia-southeast1.firebasedatabase.app/';

  var SS = sessionStorage;

  /* ───── 내부 헬퍼 ───── */
  function getInt(key, def) {
    var v = SS.getItem(key);
    return v !== null ? parseInt(v, 10) : (def || 0);
  }

  /* ───── 공개 API ───── */
  return {

    /**
     * 수사 시작 — synopsis "수사 시작하기" 버튼에서 호출
     */
    start: function () {
      SS.setItem('rcm_start_ms',    Date.now().toString());
      SS.setItem('rcm_wrong_count', '0');
      SS.setItem('rcm_hint_penalty','0'); // 초 단위 누적
    },

    /**
     * 오답 발생 시 호출 (+5초)
     * 각 챕터 정답 체크 오류 분기에 RCMRank.addWrong() 삽입
     */
    addWrong: function () {
      var cur = getInt('rcm_wrong_count');
      SS.setItem('rcm_wrong_count', (cur + 1).toString());
    },

    /**
     * 힌트 사용 시 호출
     * @param {number} level  1 → +60초 / 2 → +120초 / 3 → +210초
     */
    addHint: function (level) {
      var add = level === 1 ? 60 : level === 2 ? 120 : 210;
      var cur = getInt('rcm_hint_penalty');
      SS.setItem('rcm_hint_penalty', (cur + add).toString());
    },

    /**
     * 클리어 시 Firebase 저장 — chapter7-to-8.html 에서 호출
     * @param {function} [onDone]  저장 완료 콜백
     */
    save: function (onDone) {
      var name        = SS.getItem('rcm_player_name') || '익명';
      var startMs     = getInt('rcm_start_ms');
      var wrongCount  = getInt('rcm_wrong_count');
      var hintPenalty = getInt('rcm_hint_penalty');

      if (!startMs) {
        console.warn('[RCMRank] 시작 시간 없음 — start() 가 호출되지 않았습니다.');
        if (onDone) onDone(null);
        return;
      }

      var elapsedSec   = Math.floor((Date.now() - startMs) / 1000);
      var wrongPenalty = wrongCount * 5;                        // 오답 × 5초
      var totalSec     = elapsedSec + wrongPenalty + hintPenalty;

      var record = {
        name:         name,
        elapsed_sec:  elapsedSec,
        wrong_count:  wrongCount,
        wrong_pen:    wrongPenalty,
        hint_pen:     hintPenalty,
        total_sec:    totalSec,
        date:         new Date().toISOString().slice(0, 10)
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
     * @param {function} callback  callback(records[]) — [{name, total_sec, ...}, ...]
     */
    getTop: function (limit, callback) {
      limit = limit || 20;
      // total_sec 오름차순으로 limit 개
      var url = DB_URL + '/rankings.json'
        + '?orderBy="total_sec"&limitToFirst=' + limit;

      fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data) { callback([]); return; }
          // 객체 → 배열 변환 후 정렬
          var list = Object.values(data);
          list.sort(function (a, b) { return a.total_sec - b.total_sec; });
          callback(list);
        })
        .catch(function (err) {
          console.error('[RCMRank] 조회 실패', err);
          callback([]);
        });
    },

    /* 시간 포맷 헬퍼 — "1:23:45" 형식 */
    fmt: function (sec) {
      var h = Math.floor(sec / 3600);
      var m = Math.floor((sec % 3600) / 60);
      var s = sec % 60;
      if (h > 0) return h + ':' + pad(m) + ':' + pad(s);
      return m + ':' + pad(s);
    }
  };

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
})();
