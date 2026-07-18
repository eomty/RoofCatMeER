/**
 * rcm-common.js — RoofCatMe 공통 초기화
 * 모든 챕터 HTML에 포함됩니다.
 *
 * 담당:
 *  - sessionStorage의 이름으로 페이지 내 "탐정님" 텍스트 교체
 *  (추후 공통 기능은 여기에 추가)
 */

(function () {
  var name = sessionStorage.getItem('rcm_player_name');
  if (!name) return; // 이름 없으면 그냥 원문 유지

  function replaceName(root) {
    // 텍스트 노드만 순회하여 "탐정님" → "이름님" 교체
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
