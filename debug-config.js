/* 관리자 모드 잠금 설정.
   - 기본값은 false (손님에게 디버그탭 숨김).
   - index.html의 로고를 2초 안에 7번 탭 → 비밀번호 입력 시 활성화됨.
   - 활성화되면 이 기기(localStorage)에 기억되며, 패널 내 "관리자 해제" 버튼으로 비활성화할 수 있음.
   - 진행 순서 잠금(flow-guard.js)은 이 값과 완전히 무관하게 항상 작동합니다. */
var RCM_DEBUG_MODE = (function(){
  try { return localStorage.getItem('rcm_admin_mode') === '1'; }
  catch(e) { return false; }
})();
