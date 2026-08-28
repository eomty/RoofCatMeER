/* ===================================================================
   루프캣 방탈출 — 챕터 클리어 애니메이션 모듈
   rcm-clear.js

   주의: 반드시 </body> 직전에 로드하세요.
   <script src="rcm-clear.js"></script>
   </body>

   사용법:
     // A. 정답 순간 빛 효과
     RCMClear.correct(document.getElementById('result'));

     // B+C. CLEARED 배너 + 버튼 등장 + 페이드 이동
     RCMClear.show(
       'CHAPTER 04',          // 페이드 시 표시될 챕터명
       'chapter5.html',       // 이동할 URL
       document.getElementById('next-btn'), // 다음 버튼 요소
       'CHAPTER CLEARED'      // 배너 문구 (생략 시 기본값)
     );

   =================================================================== */
(function () {

  /* ── 공통 스타일 주입 ─────────────────────────────────────────── */
  var style = document.createElement('style');
  style.textContent = [

    /* A. 정답 빛 효과 */
    '@keyframes rcm-flash{',
      '0%{opacity:0;transform:scale(.8);}',
      '40%{opacity:1;transform:scale(1.08);}',
      '100%{opacity:0;transform:scale(1.4);}',
    '}',
    '.rcm-correct-ring{',
      'position:absolute;inset:-6px;border-radius:inherit;',
      'border:2px solid #c9a84c;pointer-events:none;',
      'animation:rcm-flash .5s ease-out forwards;',
      'z-index:10;',
    '}',
    '@keyframes rcm-check{',
      '0%{opacity:0;transform:scale(0) rotate(-20deg);}',
      '60%{opacity:1;transform:scale(1.2) rotate(4deg);}',
      '100%{opacity:1;transform:scale(1) rotate(0);}',
    '}',
    '.rcm-check{',
      'position:absolute;top:50%;left:50%;',
      'transform:translate(-50%,-50%);',
      'font-size:28px;pointer-events:none;z-index:11;',
      'animation:rcm-check .4s ease-out .1s forwards;opacity:0;',
    '}',

    /* 파티클 */
    '@keyframes rcm-particle{',
      '0%{opacity:1;transform:translate(0,0) scale(1);}',
      '100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(0);}',
    '}',
    '.rcm-particle{',
      'position:fixed;width:6px;height:6px;border-radius:50%;',
      'pointer-events:none;z-index:9999;',
      'animation:rcm-particle .6s ease-out forwards;',
    '}',

    /* B. CHAPTER CLEARED 배너 */
    '@keyframes rcm-banner-in{',
      '0%{opacity:0;letter-spacing:.5em;}',
      '100%{opacity:1;letter-spacing:.2em;}',
    '}',
    '@keyframes rcm-banner-out{',
      '0%{opacity:1;}',
      '100%{opacity:0;}',
    '}',
    '#rcm-banner{',
      'position:fixed;top:50%;left:0;right:0;transform:translateY(-50%);z-index:500;',
      'display:none;flex-direction:column;align-items:center;',
      'justify-content:center;padding:14px 0 12px;',
      'background:rgba(10,8,6,.92);',
      'border-bottom:1px solid rgba(201,168,76,.3);',
      'pointer-events:none;',
    '}',
    '#rcm-banner.show{display:flex;}',
    '#rcm-banner.hide{animation:rcm-banner-out .4s ease-out forwards;}',
    '#rcm-banner .banner-label{',
      'font-size:9px;letter-spacing:.3em;color:#776e5e;',
      'font-family:monospace;margin-bottom:4px;',
    '}',
    '#rcm-banner .banner-title{',
      'font-family:"Nanum Myeongjo",serif;font-size:18px;',
      'color:#c9a84c;font-weight:700;',
      'animation:rcm-banner-in .5s ease-out forwards;',
    '}',

    /* B. 다음 챕터 버튼 슬라이드업 */
    '@keyframes rcm-btn-in{',
      '0%{opacity:0;transform:translateY(24px);}',
      '100%{opacity:1;transform:translateY(0);}',
    '}',
    '.rcm-next-btn{',
      'animation:rcm-btn-in .5s ease-out forwards;',
    '}',
    '@keyframes rcm-btn-glow{',
      '0%,100%{box-shadow:none;}',
      '50%{box-shadow:0 0 16px rgba(201,168,76,.5);}',
    '}',
    '.rcm-next-btn.glow{',
      'animation:rcm-btn-in .5s ease-out forwards,',
        'rcm-btn-glow .8s ease-in-out .5s 1 forwards;',
    '}',

    /* C. 페이드 오버레이 */
    '#rcm-fade{',
      'position:fixed;inset:0;background:#080808;',
      'opacity:0;pointer-events:none;z-index:9998;',
      'transition:opacity .4s ease;',
    '}',
    '#rcm-fade.on{opacity:1;pointer-events:all;}',
    '#rcm-fade-label{',
      'position:fixed;inset:0;display:flex;flex-direction:column;',
      'align-items:center;justify-content:center;',
      'z-index:9999;pointer-events:none;opacity:0;',
      'transition:opacity .3s ease .15s;',
    '}',
    '#rcm-fade-label.on{opacity:1;}',
    '#rcm-fade-label .fade-chapter{',
      'font-family:"Nanum Myeongjo",serif;font-size:20px;',
      'color:rgba(255,255,255,.8);letter-spacing:.15em;font-weight:700;',
    '}',
    '#rcm-fade-label .fade-sub{',
      'font-size:11px;color:rgba(255,255,255,.3);',
      'letter-spacing:.15em;font-family:monospace;margin-top:6px;',
    '}',

  ].join('');
  document.head.appendChild(style);

  /* ── DOM 생성 ─────────────────────────────────────────────────── */
  var banner = document.createElement('div');
  banner.id = 'rcm-banner';
  banner.innerHTML =
    '<div class="banner-label">ROOFCATME</div>' +
    '<div class="banner-title" id="rcm-banner-title">CHAPTER CLEARED</div>';
  document.body.appendChild(banner);

  var fade = document.createElement('div'); fade.id = 'rcm-fade';
  var fadeLabel = document.createElement('div'); fadeLabel.id = 'rcm-fade-label';
  fadeLabel.innerHTML =
    '<div class="fade-sub">새로운 단서로 이동 중…</div>';
  document.body.appendChild(fade);
  document.body.appendChild(fadeLabel);

  /* ── 파티클 ──────────────────────────────────────────────────── */
  var COLORS = ['#c9a84c','#e8e0d0','#4caf82','#a855f7','#f0e8d8'];
  function spawnParticles(x, y) {
    for (var i = 0; i < 8; i++) {
      (function(i) {
        var p = document.createElement('div');
        p.className = 'rcm-particle';
        var angle = (i / 8) * Math.PI * 2;
        var dist = 40 + Math.random() * 40;
        p.style.cssText = [
          'left:' + x + 'px',
          'top:' + y + 'px',
          'background:' + COLORS[i % COLORS.length],
          '--dx:' + (Math.cos(angle) * dist) + 'px',
          '--dy:' + (Math.sin(angle) * dist) + 'px',
        ].join(';');
        document.body.appendChild(p);
        setTimeout(function(){ if (p.parentNode) p.parentNode.removeChild(p); }, 700);
      })(i);
    }
  }

  /* ── A. 정답 빛 효과 ─────────────────────────────────────────── */
  function correct(el) {
    if (!el) return;
    // 중복 실행 방지
    if (el.dataset.rcmCorrectPlayed === '1') return;
    el.dataset.rcmCorrectPlayed = '1';

    // 진동
    if (navigator.vibrate) navigator.vibrate([100, 50, 150]);

    // 링 효과 (overflow:hidden 피해서 body에 좌표로 삽입)
    var rect = el.getBoundingClientRect();
    var ring = document.createElement('div');
    ring.className = 'rcm-correct-ring';
    ring.style.cssText = [
      'position:fixed',
      'left:' + (rect.left - 6) + 'px',
      'top:' + (rect.top - 6) + 'px',
      'width:' + (rect.width + 12) + 'px',
      'height:' + (rect.height + 12) + 'px',
      'border-radius:4px',
      'border:2px solid #c9a84c',
      'pointer-events:none',
      'z-index:9990',
      'animation:rcm-flash .5s ease-out forwards',
    ].join(';');
    document.body.appendChild(ring);
    setTimeout(function(){ if (ring.parentNode) ring.parentNode.removeChild(ring); }, 600);

    // 체크 표시
    var check = document.createElement('div');
    check.className = 'rcm-check';
    check.style.cssText = [
      'position:fixed',
      'left:' + (rect.left + rect.width / 2) + 'px',
      'top:' + (rect.top + rect.height / 2) + 'px',
      'transform:translate(-50%,-50%)',
      'font-size:28px',
      'pointer-events:none',
      'z-index:9991',
      'animation:rcm-check .4s ease-out .1s forwards',
      'opacity:0',
    ].join(';');
    check.textContent = '✓';
    document.body.appendChild(check);
    setTimeout(function(){ if (check.parentNode) check.parentNode.removeChild(check); }, 1200);

    // 파티클
    spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  /* ── B+C. CLEARED 배너 + 버튼 등장 + 페이드 이동 ─────────────── */
  var clearShown = false;

  function show(chapterLabel, href, btnEl, bannerText) {
    // 중복 실행 방지
    if (clearShown) return;
    clearShown = true;

    bannerText = bannerText || 'CHAPTER CLEARED';
    document.getElementById('rcm-banner-title').textContent = bannerText;

    // B-1. 배너 등장 → 1.8초 후 자동 숨김
    setTimeout(function() {
      banner.classList.add('show');
      setTimeout(function() {
        banner.classList.add('hide');
        setTimeout(function() {
          banner.classList.remove('show', 'hide');
        }, 400);
      }, 1800);
    }, 300);

    // B-2. 버튼 슬라이드업 + 글로우
    if (btnEl) {
      setTimeout(function() {
        btnEl.style.display = 'block';
        btnEl.classList.add('rcm-next-btn', 'glow');

        // B-3. 버튼 클릭 시 C 페이드로 이동
        btnEl.onclick = function(e) {
          e.preventDefault();
          goFade(chapterLabel, href);
        };
      }, 600);
    }
  }

  /* ── C. 페이드 전환 ──────────────────────────────────────────── */
  function goFade(chapterLabel, href) {
    fade.classList.add('on');
    fadeLabel.classList.add('on');
    setTimeout(function() {
      location.href = href;
    }, 1500);
  }

  /* ── 공개 API ─────────────────────────────────────────────────── */
  window.RCMClear = {
    correct: correct,
    show: show,
    goFade: goFade,
  };

})();
