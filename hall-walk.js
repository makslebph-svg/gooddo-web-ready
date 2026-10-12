(() => {
  const frames = [...document.querySelectorAll('.walk-frame')];
  const hallNav = [...document.querySelectorAll('[data-hall]')];
  const demo = document.getElementById('demo');
  const deck = document.getElementById('deck');
  const hint = document.getElementById('hint');
  const description = document.getElementById('walk-description');
  const shortcut = document.getElementById('walk-to-art');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));
  let previousAvailable = false, displayedFrame = -1, displayedHall = -1, displayedStep = -1;
  const cuts = [0, .21, .48, .87, 1];

  window.updateHallWalk = (position, hallVisible) => {
    const route = clamp(position) * window.GOODDO_HALLS.length;
    const hallIndex = Math.min(window.GOODDO_HALLS.length - 1, Math.floor(route));
    const p = Math.min(1, route - hallIndex);
    const hall = window.GOODDO_HALLS[hallIndex];
    const step = p < cuts[1] ? 0 : p < cuts[2] ? 1 : p < cuts[3] ? 2 : 3;
    const frameStart = window.GOODDO_HALLS.slice(0,hallIndex).reduce((sum,item) => sum + item.frames,0);
    const frameIndex = frameStart + (hall.frames === 1 ? 0 : step);
    // Hard cuts: exactly one opaque image is displayed at every scroll position.
    if (frameIndex !== displayedFrame) {
      frames.forEach((frame, i) => { frame.hidden = i !== frameIndex; });
      displayedFrame = frameIndex;
    }
    if (step !== displayedStep || hallIndex !== displayedHall) {
      document.getElementById('walk-title').textContent = hall.title;
      document.getElementById('walk-instruction').textContent = hall.caption;
      displayedStep = step;
    }
    if (hallIndex !== displayedHall) {
      window.leavePortfolio?.();
      window.setPortfolioHall(hallIndex);
      displayedHall = hallIndex;
      demo.dataset.hall = hall.id;
      demo.setAttribute('aria-label', hall.title);
      document.querySelector('.gallery-kicker').textContent = 'GOODDO / ЗАЛ 0' + (hallIndex + 1) + ' / 0' + window.GOODDO_TOTAL_HALLS;
      document.getElementById('deck-heading').textContent = hall.title;
      hallNav.forEach(button => button.setAttribute('aria-current', Number(button.dataset.hall) === hallIndex ? 'step' : 'false'));
    }
    const travel = clamp((p - cuts[step]) / (cuts[step + 1] - cuts[step]));
    frames[frameIndex].style.transform = still.matches ? 'none' : hall.frames === 1
      ? 'scale(' + (1.02 + p * .08) + ') translateX(' + ((p - .5) * 1.4) + '%)'
      : 'scale(' + (1.025 + travel * .055) + ') translateX(' + ([-1, -.8, .6, .8][step] * travel) + '%)';
    const available = hallVisible && p >= .5 && p <= .86;
    if (previousAvailable && !available) window.leavePortfolio?.();
    previousAvailable = available;
    demo.classList.toggle('show-cases', available);
    deck.style.opacity = available ? 1 : 0;
    deck.inert = !available;
    hint.style.opacity = available ? 1 : 0;
    hint.setAttribute('aria-hidden', String(!available));
    description.style.opacity = hallVisible ? 1 : 0;
    description.setAttribute('aria-hidden', String(!hallVisible));
    shortcut.hidden = available;
    demo.dataset.walkPosition = p.toFixed(4);
    demo.dataset.walkStep = String(step + 1);
    demo.dataset.hallIndex = String(hallIndex);
    demo.dataset.frameIndex = String(frameIndex);
  };
})();

