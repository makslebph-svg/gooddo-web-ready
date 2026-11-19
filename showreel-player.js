// GoodDo showreel player v28 — one video source, custom glass controls
(() => {
  const scene = document.getElementById('glass-scene');
  const player = document.getElementById('glass-shell');
  const reel = document.getElementById('showreel-video');
  const $ = id => document.getElementById(id);
  const status = $('status');
  const REEL_SRC = 'assets/case-media/showreel-2025.mp4'; // единственный источник

  const els = {play:$('reel-play'), toggle:$('reel-toggle'), back:$('reel-back'), fwd:$('reel-fwd'),
    mute:$('reel-mute'), volume:$('reel-volume'), seek:$('reel-seek'), fill:$('reel-fill'), buffer:$('reel-buffer'),
    current:$('reel-current'), total:$('reel-total'), duration:$('reel-duration'), pip:$('reel-pip'),
    expand:$('reel-expand'), surface:$('reel-surface'), flash:$('reel-flash')};
  const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; };
  const clamp01 = n => Math.max(0, Math.min(1, n));
  const easeOut = p => 1 - Math.pow(1 - p, 3);
  let visible = false, idleTimer, surfaceClickTimer, seeking = false, lastVolume = 1;
  let touchControls = !matchMedia('(any-pointer: fine) and (any-hover: hover)').matches;
  const say = text => { status.textContent = text; };
  const inPip = () => document.pictureInPictureElement === reel || reel.webkitPresentationMode === 'picture-in-picture';
  const inFullscreen = () => document.fullscreenElement === player
    || reel.webkitDisplayingFullscreen === true || reel.webkitPresentationMode === 'fullscreen';
  const setPresentation = mode => {
    if (reel.webkitSupportsPresentationMode?.(mode)) {
      reel.webkitSetPresentationMode(mode);
      return true;
    }
    return false;
  };

  window.updateGlassScene = progress => {
    scene.style.opacity = easeOut(clamp01(progress / .08));
    const available = progress >= .06;
    scene.inert = !available;
    scene.setAttribute('aria-hidden', String(!available));
    if (available !== visible) {
      visible = available;
      if (visible) wake();
      else stopOnLeave();
    }
    if (available && !reel.hasAttribute('src')) {
      reel.preload = 'metadata';
      reel.src = REEL_SRC;
    }
  };
  function stopOnLeave() {
    clearTimeout(surfaceClickTimer);
    clearTimeout(idleTimer);
    reel.pause();
    if (document.pictureInPictureElement === reel) document.exitPictureInPicture().catch(() => {});
    if (document.fullscreenElement === player) document.exitFullscreen().catch(() => {});
    try {
      if (reel.webkitPresentationMode && reel.webkitPresentationMode !== 'inline' && setPresentation('inline')) return;
      if (reel.webkitDisplayingFullscreen) reel.webkitExitFullscreen?.();
    } catch {
      // Playback is already stopped if the system presentation cannot be closed.
    }
  }
  function render() {
    if (!reel.paused && (scene.inert || !visible)) { stopOnLeave(); return; }
    const playing = !reel.paused;
    const d = Number.isFinite(reel.duration) ? reel.duration : 0;
    player.classList.toggle('is-playing', playing);
    player.classList.toggle('is-started', playing || reel.currentTime > 0);
    player.classList.toggle('is-ended', d > 0 && reel.currentTime >= d - .05 && !playing);
    els.play.tabIndex = playing ? -1 : 0;
    els.play.setAttribute('aria-hidden', String(playing));
    els.play.setAttribute('aria-label', player.classList.contains('is-ended') ? 'Смотреть шоурил снова' : 'Смотреть шоурил');
    if (playing && document.activeElement === els.play) els.toggle.focus({preventScroll:true});
    els.toggle.setAttribute('aria-label', playing ? 'Пауза' : 'Воспроизвести');
    const muted = reel.muted || reel.volume === 0;
    player.classList.toggle('is-muted', muted);
    els.mute.setAttribute('aria-label', muted ? 'Включить звук' : 'Выключить звук');
    els.volume.value = muted ? 0 : reel.volume;
    els.volume.style.setProperty('--v', (muted ? 0 : reel.volume) * 100 + '%');
    const p = d ? reel.currentTime / d : 0;
    if (!seeking) els.seek.value = p * 100;
    els.seek.disabled = els.back.disabled = els.fwd.disabled = d <= 0;
    els.fill.style.transform = `scaleX(${clamp01(p)})`;
    els.current.textContent = fmt(reel.currentTime);
    els.total.textContent = els.duration.textContent = fmt(d);
    els.seek.setAttribute('aria-valuetext', `${fmt(reel.currentTime)} из ${fmt(d)}`);
    const buffered = reel.buffered.length && d ? reel.buffered.end(reel.buffered.length - 1) / d : 0;
    els.buffer.style.transform = `scaleX(${clamp01(buffered)})`;
  }
  async function toggle() {
    if (!visible) return;
    if (!reel.paused) { reel.pause(); return; }
    try { await reel.play(); } catch { say('Не удалось воспроизвести шоурил, попробуйте ещё раз'); }
  }
  function skip(sec) {
    if (!Number.isFinite(reel.duration) || reel.duration <= 0) return;
    reel.currentTime = Math.max(0, Math.min(reel.duration, reel.currentTime + sec));
    els.flash.textContent = (sec > 0 ? '+' : '−') + Math.abs(sec) + ' с';
    els.flash.dataset.side = sec > 0 ? 'right' : 'left';
    els.flash.classList.remove('show'); void els.flash.offsetWidth; els.flash.classList.add('show');
    wake();
  }
  function setVolume(v) {
    v = clamp01(v); reel.volume = v; reel.muted = v === 0; if (v > 0) lastVolume = v; render();
  }
  function wake(event) {
    if (event?.pointerType) touchControls = event.pointerType === 'touch';
    player.classList.remove('is-idle'); clearTimeout(idleTimer);
    if (!visible || (touchControls && reel.paused)) return;
    idleTimer = setTimeout(() => {
      if (!player.querySelector(':focus-visible, input[type="range"]:active')) player.classList.add('is-idle');
    }, touchControls ? 2600 : 1000);
  }
  els.play.onclick = toggle; els.toggle.onclick = toggle;
  els.surface.addEventListener('click', event => {
    if (event.pointerType === 'touch') { toggle(); return; }
    clearTimeout(surfaceClickTimer);
    if (event.detail === 1) surfaceClickTimer = setTimeout(toggle, 280);
  });
  els.surface.addEventListener('dblclick', () => {
    clearTimeout(surfaceClickTimer);
    els.expand.click();
  });
  els.back.onclick = () => skip(-10); els.fwd.onclick = () => skip(10);
  els.mute.onclick = () => { if (reel.muted || reel.volume === 0) setVolume(lastVolume || 1); else { reel.muted = true; render(); } };
  els.volume.addEventListener('input', () => setVolume(Number(els.volume.value)));
  els.seek.addEventListener('input', () => { seeking = true; const d = reel.duration; if (Number.isFinite(d)) reel.currentTime = Number(els.seek.value) / 100 * d; seeking = false; });
  els.pip.onclick = async () => {
    if (!visible) return;
    try {
      if (document.pictureInPictureElement === reel) await document.exitPictureInPicture();
      else if (reel.webkitPresentationMode === 'picture-in-picture') setPresentation('inline');
      else if (document.pictureInPictureEnabled && reel.requestPictureInPicture && reel.readyState > 0) await reel.requestPictureInPicture();
      else if (reel.readyState > 0 && setPresentation('picture-in-picture')) return;
      else say('«Картинка в картинке» станет доступна, когда загрузится видео');
    } catch { say('«Картинка в картинке» недоступна в этом браузере'); }
  };
  if (!document.pictureInPictureEnabled && !reel.webkitSupportsPresentationMode) els.pip.hidden = true;

  function updatePresentation() {
    els.pip.setAttribute('aria-pressed', String(inPip()));
    player.classList.toggle('is-fs', document.fullscreenElement === player);
    els.expand.setAttribute('aria-label', inFullscreen() ? 'Выйти из полноэкранного режима' : 'Развернуть шоурил');
    if (!visible && (inPip() || inFullscreen())) stopOnLeave();
  }

  els.expand.onclick = async () => {
    if (!visible) return;
    try {
      if (document.fullscreenElement === player) { await document.exitFullscreen(); return; }
      if (reel.webkitPresentationMode === 'fullscreen' && setPresentation('inline')) return;
      if (reel.webkitDisplayingFullscreen) { reel.webkitExitFullscreen?.(); return; }
      if (document.fullscreenEnabled && player.requestFullscreen) { await player.requestFullscreen(); return; }
      if (setPresentation('fullscreen')) return;
      else if (reel.webkitEnterFullscreen) reel.webkitEnterFullscreen();
      else say('Полноэкранный просмотр недоступен в этом браузере');
    } catch { say('Полноэкранный просмотр недоступен в этом браузере'); }
  };
  document.addEventListener('fullscreenchange', updatePresentation);
  for (const event of ['enterpictureinpicture','leavepictureinpicture','webkitpresentationmodechanged','webkitbeginfullscreen','webkitendfullscreen']) {
    reel.addEventListener(event, updatePresentation);
  }
  player.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    if (e.target.matches('input[type=range]') && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)) return;
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'k' || k === 'л') { if (e.target.tagName === 'BUTTON' && k === ' ') return; e.preventDefault(); toggle(); }
    else if (e.key === 'ArrowLeft' || k === 'j' || k === 'о') { e.preventDefault(); skip(-10); }
    else if (e.key === 'ArrowRight' || k === 'l' || k === 'д') { e.preventDefault(); skip(10); }
    else if (k === 'm' || k === 'ь') els.mute.click();
    else if (k === 'f' || k === 'а') els.expand.click();
    else return;
    e.stopPropagation();
  });
  ['pointerenter','pointermove','pointerdown','pointerup','focusin','focusout'].forEach(ev => player.addEventListener(ev, wake));
  for (const ev of ['play','pause','ended','timeupdate','loadedmetadata','durationchange','progress','volumechange','seeked']) reel.addEventListener(ev, render);
  reel.addEventListener('play', wake);
  reel.addEventListener('pause', wake);
  document.addEventListener('visibilitychange', () => { if (document.hidden && !inPip()) reel.pause(); });
  document.addEventListener('click', e => { const t = e.target.closest?.('.route-nav button,#cases-subnav button,.route-brand'); if (t) reel.pause(); });
  render();
  updatePresentation();
})();
