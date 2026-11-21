// Both the showreel and case modal use the same controls and playback behavior.
(() => {
  const scene = document.getElementById('glass-scene');
  const player = document.getElementById('glass-shell');
  const reel = document.getElementById('showreel-video');
  const status = document.getElementById('status');
  const caseDialog = document.getElementById('project');
  const casePlayer = document.getElementById('case-player');
  const caseVideo = document.getElementById('project-video');
  const caseStatus = document.getElementById('case-player-status');
  const reelScreen = player.querySelector('.gd-screen');
  const caseScreen = casePlayer.querySelector('.gd-screen');

  for (const control of reelScreen.querySelectorAll(':scope > :is(.gd-surface, .gd-shade, .gd-bigplay, .gd-flash, .gd-controls)')) {
    const copy = control.cloneNode(true);
    for (const element of [copy, ...copy.querySelectorAll('[id]')]) {
      if (element.id) element.id = element.id.replace(/^reel-/, 'case-');
    }
    (copy.classList.contains('gd-controls') ? casePlayer : caseScreen).append(copy);
  }
  casePlayer.querySelector('.gd-seek').setAttribute('aria-label', 'Позиция видео');
  caseVideo.controls = false;

  function fitCaseVideo() {
    if (!caseVideo.videoWidth || !caseVideo.videoHeight) return;
    casePlayer.style.setProperty('--case-ratio', caseVideo.videoWidth / caseVideo.videoHeight);
  }
  caseVideo.addEventListener('loadedmetadata', fitCaseVideo);
  caseVideo.addEventListener('resize', fitCaseVideo);

  new ResizeObserver(() => {
    requestAnimationFrame(() => {
      const height = caseScreen.clientHeight;
      if (!height || casePlayer.matches(':fullscreen, .is-fs')) return;
      const style = getComputedStyle(casePlayer);
      const ratio = parseFloat(style.getPropertyValue('--case-ratio'));
      const reserve = casePlayer.classList.contains('controls-below')
        ? parseFloat(style.getPropertyValue('--case-controls-reserve')) : 0;
      // Use the available size before reserving space for the toolbar.
      const frameHeight = Math.min(casePlayer.clientWidth / ratio, height + reserve);
      casePlayer.classList.toggle('controls-below', frameHeight < 102 || frameHeight * ratio < 232);
    });
  }).observe(caseScreen);

  const showreel = mountPlayer(player, reel, 'reel', () => !scene.inert, status, 'Смотреть шоурил');
  window.gooddoCasePlayer = mountPlayer(casePlayer, caseVideo,
    'case', () => caseDialog.open && !caseDialog.classList.contains('closing') && !casePlayer.hidden,
    caseStatus, 'Смотреть видео');

  window.updateGlassScene = progress => {
    const available = progress >= 0;
    const changed = available === scene.inert;
    scene.style.opacity = available ? 1 : 0;
    scene.inert = !available;
    scene.setAttribute('aria-hidden', String(!available));
    if (changed) {
      if (available) showreel.wake();
      else showreel.stop();
    }
    if (available && !reel.hasAttribute('src')) {
      reel.preload = 'metadata';
      reel.src = 'assets/case-media/showreel-2025.mp4';
    }
  };

  document.addEventListener('click', event => {
    if (event.target.closest?.('.route-nav button, #cases-subnav button, .route-brand')) showreel.stop();
  });

  function mountPlayer(player, video, prefix, active, status, playLabel) {
    const $ = name => player.querySelector(`#${prefix}-${name}`);
    const els = {play:$('play'), toggle:$('toggle'), back:$('back'), fwd:$('fwd'),
      mute:$('mute'), volume:$('volume'), seek:$('seek'), fill:$('fill'), buffer:$('buffer'),
      current:$('current'), total:$('total'), pip:$('pip'),
      expand:$('expand'), surface:$('surface'), flash:$('flash')};
    const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; };
    const clamp01 = n => Math.max(0, Math.min(1, n));
    let idleTimer, surfaceClickTimer, seeking = false, lastVolume = 1;
    let touchControls = !matchMedia('(any-pointer: fine) and (any-hover: hover)').matches;
    const say = text => { status.textContent = text; };
    const inPip = () => document.pictureInPictureElement === video || video.webkitPresentationMode === 'picture-in-picture';
    const inFullscreen = () => document.fullscreenElement === player
      || video.webkitDisplayingFullscreen === true || video.webkitPresentationMode === 'fullscreen';
    const setPresentation = mode => {
      if (video.webkitSupportsPresentationMode?.(mode)) {
        video.webkitSetPresentationMode(mode);
        return true;
      }
      return false;
    };

    function stopOnLeave() {
      clearTimeout(surfaceClickTimer);
      clearTimeout(idleTimer);
      video.pause();
      if (document.pictureInPictureElement === video) document.exitPictureInPicture().catch(() => {});
      if (document.fullscreenElement === player) document.exitFullscreen().catch(() => {});
      try {
        if (video.webkitPresentationMode && video.webkitPresentationMode !== 'inline' && setPresentation('inline')) return;
        if (video.webkitDisplayingFullscreen) video.webkitExitFullscreen?.();
      } catch {
        // Playback is already stopped if the system presentation cannot be closed.
      }
    }
    function render() {
      if (!video.paused && !active()) { stopOnLeave(); return; }
      const playing = !video.paused;
      const d = Number.isFinite(video.duration) ? video.duration : 0;
      player.classList.toggle('is-playing', playing);
      player.classList.toggle('is-started', playing || video.currentTime > 0);
      player.classList.toggle('is-ended', d > 0 && video.currentTime >= d - .05 && !playing);
      els.play.tabIndex = playing ? -1 : 0;
      els.play.setAttribute('aria-hidden', String(playing));
      els.play.setAttribute('aria-label', player.classList.contains('is-ended') ? playLabel + ' снова' : playLabel);
      if (playing && document.activeElement === els.play) els.toggle.focus({preventScroll:true});
      els.toggle.setAttribute('aria-label', playing ? 'Пауза' : 'Воспроизвести');
      const muted = video.muted || video.volume === 0;
      player.classList.toggle('is-muted', muted);
      els.mute.setAttribute('aria-label', muted ? 'Включить звук' : 'Выключить звук');
      els.volume.value = muted ? 0 : video.volume;
      els.volume.style.setProperty('--v', (muted ? 0 : video.volume) * 100 + '%');
      const p = d ? video.currentTime / d : 0;
      if (!seeking) els.seek.value = p * 100;
      els.seek.disabled = els.back.disabled = els.fwd.disabled = d <= 0;
      els.fill.style.transform = `scaleX(${clamp01(p)})`;
      els.current.textContent = fmt(video.currentTime);
      els.total.textContent = fmt(d);
      els.seek.setAttribute('aria-valuetext', `${fmt(video.currentTime)} из ${fmt(d)}`);
      const buffered = video.buffered.length && d ? video.buffered.end(video.buffered.length - 1) / d : 0;
      els.buffer.style.transform = `scaleX(${clamp01(buffered)})`;
    }
    async function toggle() {
      if (!active()) return;
      if (!video.paused) { video.pause(); return; }
      try { await video.play(); } catch { say('Не удалось воспроизвести видео, попробуйте ещё раз'); }
    }
    function skip(sec) {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + sec));
      els.flash.textContent = (sec > 0 ? '+' : '−') + Math.abs(sec) + ' с';
      els.flash.dataset.side = sec > 0 ? 'right' : 'left';
      els.flash.classList.remove('show'); void els.flash.offsetWidth; els.flash.classList.add('show');
      wake();
    }
    function setVolume(v) {
      v = clamp01(v); video.volume = v; video.muted = v === 0; if (v > 0) lastVolume = v; render();
    }
    function wake(event) {
      if (event?.pointerType) touchControls = event.pointerType === 'touch';
      player.classList.remove('is-idle'); clearTimeout(idleTimer);
      if (!active() || (touchControls && video.paused)) return;
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
    els.mute.onclick = () => { if (video.muted || video.volume === 0) setVolume(lastVolume || 1); else { video.muted = true; render(); } };
    els.volume.addEventListener('input', () => setVolume(Number(els.volume.value)));
    els.seek.addEventListener('input', () => { seeking = true; const d = video.duration; if (Number.isFinite(d)) video.currentTime = Number(els.seek.value) / 100 * d; seeking = false; });
    els.pip.onclick = async () => {
      if (!active()) return;
      try {
        if (document.pictureInPictureElement === video) await document.exitPictureInPicture();
        else if (video.webkitPresentationMode === 'picture-in-picture') setPresentation('inline');
        else if (document.pictureInPictureEnabled && video.requestPictureInPicture && video.readyState > 0) await video.requestPictureInPicture();
        else if (video.readyState > 0 && setPresentation('picture-in-picture')) return;
        else say('«Картинка в картинке» станет доступна, когда загрузится видео');
      } catch { say('«Картинка в картинке» недоступна в этом браузере'); }
    };
    if (!document.pictureInPictureEnabled && !video.webkitSupportsPresentationMode) els.pip.hidden = true;

    function updatePresentation() {
      els.pip.setAttribute('aria-pressed', String(inPip()));
      player.classList.toggle('is-fs', document.fullscreenElement === player);
      els.expand.setAttribute('aria-label', inFullscreen() ? 'Выйти из полноэкранного режима' : 'Развернуть видео');
      if (!active() && (inPip() || inFullscreen())) stopOnLeave();
    }

    els.expand.onclick = async () => {
      if (!active()) return;
      try {
        if (document.fullscreenElement === player) { await document.exitFullscreen(); return; }
        if (video.webkitPresentationMode === 'fullscreen' && setPresentation('inline')) return;
        if (video.webkitDisplayingFullscreen) { video.webkitExitFullscreen?.(); return; }
        if (document.fullscreenEnabled && player.requestFullscreen) { await player.requestFullscreen(); return; }
        if (setPresentation('fullscreen')) return;
        else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
        else say('Полноэкранный просмотр недоступен в этом браузере');
      } catch { say('Полноэкранный просмотр недоступен в этом браузере'); }
    };
    document.addEventListener('fullscreenchange', updatePresentation);
    for (const event of ['enterpictureinpicture','leavepictureinpicture','webkitpresentationmodechanged','webkitbeginfullscreen','webkitendfullscreen']) {
      video.addEventListener(event, updatePresentation);
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
    for (const ev of ['emptied','play','pause','ended','timeupdate','loadedmetadata','durationchange','progress','volumechange','seeked']) video.addEventListener(ev, render);
    video.addEventListener('playing', () => player.classList.add('has-played'), { once: true });
    video.addEventListener('play', wake);
    video.addEventListener('pause', wake);
    document.addEventListener('visibilitychange', () => { if (document.hidden && !inPip()) video.pause(); });
    render();
    updatePresentation();
    return { stop: stopOnLeave, wake };
  }
})();
