(() => {
  const journey = document.getElementById('journey');
  const hud = journey.querySelector('.route-hud');
  const nav = hud.querySelector('.route-nav');
  const casesTrigger = document.getElementById('cases-nav-trigger');
  const hallNav = document.getElementById('cases-subnav');
  const hallButtons = [...hallNav.querySelectorAll('[data-hall]')];
  const mobile = matchMedia('(max-width: 760px), (max-width: 960px) and (max-height: 440px)');
  const toggle = document.createElement('button');

  nav.id ||= 'route-main-navigation';
  toggle.type = 'button';
  toggle.className = 'route-menu-toggle';
  toggle.textContent = 'Меню';
  toggle.setAttribute('aria-controls', nav.id);
  toggle.setAttribute('aria-expanded', 'false');
  nav.before(toggle);

  let desktopOpen = false;
  let inHall = false;
  let moving = false;
  let activeHall = null;
  let pendingFocus = null;

  function updateHudHeight() {
    journey.style.setProperty('--route-hud-height', `${hud.offsetHeight}px`);
  }
  new ResizeObserver(updateHudHeight).observe(hud);
  updateHudHeight();

  function setMobileOpen(open, restoreFocus = false) {
    nav.hidden = mobile.matches && !open;
    toggle.setAttribute('aria-expanded', String(mobile.matches && open));
    if (restoreFocus && mobile.matches) toggle.focus({preventScroll: true});
  }

  function updateHallNav() {
    hallNav.hidden = !inHall && (mobile.matches || !desktopOpen || moving);
    if (mobile.matches) {
      casesTrigger.removeAttribute('aria-expanded');
      casesTrigger.removeAttribute('aria-controls');
    } else {
      casesTrigger.setAttribute('aria-expanded', String(!hallNav.hidden));
      casesTrigger.setAttribute('aria-controls', hallNav.id);
    }
  }

  toggle.addEventListener('click', () => {
    setMobileOpen(nav.hidden);
  });

  mobile.addEventListener('change', () => {
    desktopOpen = false;
    setMobileOpen(false, nav.contains(document.activeElement));
    updateHallNav();
  });
  setMobileOpen(false);

  casesTrigger.addEventListener('click', event => {
    if (mobile.matches) {
      setMobileOpen(false, true);
      if (!inHall) goTo(chapterPositions[3]);
      return;
    }
    if (inHall) {
      (activeHall || hallButtons[0]).focus({preventScroll: true});
      return;
    }
    desktopOpen = !desktopOpen;
    updateHallNav();
    if (desktopOpen && event.detail === 0) hallButtons[0].focus({preventScroll: true});
  });

  casesTrigger.addEventListener('keydown', event => {
    if (event.key !== 'ArrowDown' || mobile.matches) return;
    event.preventDefault();
    desktopOpen = !inHall;
    updateHallNav();
    (activeHall || hallButtons[0]).focus({preventScroll: true});
  });

  hallNav.addEventListener('keydown', event => {
    const index = hallButtons.indexOf(event.target);
    if (index < 0) return;
    const delta = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1, ArrowDown: 1}[event.key];
    if (!delta && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const next = delta ? (index + delta + hallButtons.length) % hallButtons.length
      : event.key === 'Home' ? 0 : hallButtons.length - 1;
    hallButtons[next].focus({preventScroll: true});
  });

  hallNav.addEventListener('click', event => {
    const button = event.target.closest('[data-hall]');
    if (!button || inHall) return;
    if (!mobile.matches && event.detail === 0) {
      pendingFocus = button;
      casesTrigger.focus({preventScroll: true});
    }
    desktopOpen = false;
    updateHallNav();
  });

  nav.addEventListener('click', event => {
    if (mobile.matches && event.target.closest('button')) setMobileOpen(false, true);
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return;
    if (mobile.matches && !nav.hidden) {
      setMobileOpen(false, true);
    } else if (desktopOpen && !inHall) {
      desktopOpen = false;
      if (hallNav.contains(document.activeElement)) casesTrigger.focus({preventScroll: true});
      updateHallNav();
    }
  });
  document.addEventListener('click', event => {
    if (!nav.contains(event.target) && !toggle.contains(event.target) && mobile.matches && !nav.hidden) {
      setMobileOpen(false, nav.contains(document.activeElement));
    }
    if (desktopOpen && !casesTrigger.contains(event.target) && !hallNav.contains(event.target)) {
      desktopOpen = false;
      updateHallNav();
    }
  });

  document.querySelectorAll('.gooddo-project-form .t-input').forEach(input => input.removeAttribute('placeholder'));
  document.querySelector('[data-route="clients"]').addEventListener('click', () => {
    goTo(clientsHold.offset + clientsHold.weight * .5);
  });
  const brand = hud.querySelector('.route-brand');
  brand.href = '#home';
  brand.removeAttribute('target');
  brand.setAttribute('aria-label', 'GoodDo — главная');
  brand.addEventListener('click', () => setMobileOpen(false));

  window.updateCasesNavigation = (segment, isMoving) => {
    inHall = segment.kind === 'hall';
    moving = isMoving;
    if (inHall) desktopOpen = false;
    if (!inHall && !desktopOpen && hallNav.contains(document.activeElement)) {
      (mobile.matches ? toggle : casesTrigger).focus({preventScroll: true});
    }
    activeHall = inHall ? hallButtons.find(button => Number(button.dataset.hall) === segment.hall) : null;
    hallButtons.forEach(button => {
      if (button === activeHall) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    updateHallNav();

    if (pendingFocus && !moving) {
      const button = pendingFocus;
      pendingFocus = null;
      if (button === activeHall && document.activeElement === casesTrigger) {
        requestAnimationFrame(() => {
          if (button === activeHall && document.activeElement === casesTrigger) button.focus({preventScroll: true});
        });
      }
    }
  };
  syncScroll();
})();
