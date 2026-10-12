const glassScene = document.getElementById('glass-scene');
const glassShell = document.getElementById('glass-shell');
const reel = document.getElementById('showreel-video');
reel.src = window.gooddoVideoSource(reel, 'assets/case-media/showreel-2025.mp4');
const reelToggle = document.getElementById('reel-toggle');
const reelSeek = document.getElementById('reel-seek');
const reelTime = document.getElementById('reel-time');
const reelExpand = document.getElementById('reel-expand');
const reelMute = document.getElementById('reel-mute');
const prefersStill = matchMedia('(prefers-reduced-motion: reduce)');
let reelVisible = false;
const clamp01 = n => Math.max(0, Math.min(1, n));
const easeOut = p => 1 - Math.pow(1 - p, 3);
const easeInOut = p => p < .5 ? 4*p*p*p : 1 - Math.pow(-2*p+2,3)/2;
window.updateGlassScene = time => {
  const entrance = easeOut(clamp01((time - 30.1) / .85));
  const exit = easeInOut(clamp01((time - 34.25) / .75));
  const opacity = entrance * (1 - clamp01((time - 34.45) / .55));
  glassScene.style.opacity = opacity;
  glassShell.style.transform = prefersStill.matches ? 'none' : `translateY(${(1-entrance)*180-exit*innerHeight*1.08}px) scale(${.82+.18*entrance-.04*exit}) rotateX(${(1-entrance)*6}deg)`;
  const available = time >= 30.95 && time <= 34.45;
  glassScene.inert = !available;
  glassScene.setAttribute('aria-hidden', String(!available));
  if (!available && reelVisible) reel.pause();
  reelVisible = available;
};
function updateReelControls() {
  const playing = !reel.paused;
  glassShell.classList.toggle('is-playing', playing);
  const centerPlay = document.getElementById('reel-play');
  if (playing && document.activeElement === centerPlay) reelToggle.focus({preventScroll:true});
  centerPlay.tabIndex = playing ? -1 : 0;
  centerPlay.setAttribute('aria-hidden', String(playing));
  reelToggle.textContent = playing ? 'Ⅱ' : '▶';
  reelToggle.setAttribute('aria-label', playing ? 'Приостановить шоурил' : 'Воспроизвести шоурил');
  reelMute.textContent = reel.muted ? '♪̸' : '♫';
  reelMute.setAttribute('aria-label', reel.muted ? 'Включить звук' : 'Выключить звук');
  const time = Math.floor(reel.currentTime);
  reelTime.textContent = `${Math.floor(time/60)}:${String(time%60).padStart(2,'0')}`;
  if (Number.isFinite(reel.duration)) reelSeek.value = reel.currentTime / reel.duration * 100;
}
async function toggleReel() {
  if (!reelVisible) return;
  if (!reel.paused) { reel.pause(); return; }
  try { await reel.play(); }
  catch { document.getElementById('status').textContent = 'Не удалось воспроизвести превью — попробуйте ещё раз'; }
}
document.getElementById('reel-play').onclick = toggleReel;
reelToggle.onclick = toggleReel;
reelMute.onclick = () => { reel.muted = !reel.muted; updateReelControls(); };
reelSeek.addEventListener('input', () => {
  if (Number.isFinite(reel.duration)) reel.currentTime = Number(reelSeek.value) / 100 * reel.duration;
});
for (const event of ['play','pause','ended','timeupdate','loadedmetadata']) reel.addEventListener(event, updateReelControls);
reelExpand.onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (glassShell.requestFullscreen) await glassShell.requestFullscreen();
    else if (reel.webkitEnterFullscreen) reel.webkitEnterFullscreen();
  } catch { document.getElementById('status').textContent = 'Полноэкранный просмотр недоступен в этом браузере'; }
};
document.addEventListener('fullscreenchange', () => {
  reelExpand.setAttribute('aria-label', document.fullscreenElement ? 'Выйти из полноэкранного просмотра' : 'Развернуть шоурил');
});
addEventListener('scroll', () => { if (!document.fullscreenElement) reel.pause(); }, {passive:true});
document.addEventListener('visibilitychange', () => { if (document.hidden) reel.pause(); });
