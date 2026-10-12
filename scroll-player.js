// A single paused film follows native scroll in both directions.
const film = document.getElementById('scroll-film');
const journey = document.getElementById('journey');
const loading = document.getElementById('loading');
const portfolio = document.getElementById('demo');
const heroCopy = document.getElementById('hero-copy');
const finalScene = document.getElementById('final-scene');
const finalContent = finalScene.querySelector('.final-content');
const loopHero = document.getElementById('loop-hero');
const chapters = [...document.querySelectorAll('[data-progress]')];
const titles = [...document.querySelectorAll('.story-title')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = n => Math.max(0,Math.min(1,n));
const clips = window.GOODDO_VIDEO_CLIPS;
const segments = [];
let total = 0;
function add(kind, start, end, weight, hall = -1) {
  const segment = {kind,start,end,weight,hall,offset:total};
  segments.push(segment); total += weight;
  return segment;
}
const holds=[];
clips.forEach((clip,i) => {
  // Reverse only the daylight clip; all subsequent passages keep their direction.
  add(i===0?'hero':'travel',i===0?clip.end-1/24:clip.start,i===0?clip.start:clip.end-1/24,clip.end-clip.start,i>=4&&i<=8?i-4:-1);
  if(i===2) add('showreel',clip.end-1/24,clip.end-1/24,5);
  if(i>=3&&i<=7) holds.push(add('hall',clip.end-1/24,clip.end-1/24,4,i-3));
});
const finale=add('final',clips.at(-1).end-1/24,clips.at(-1).end-1/24,6);
const reelSegment=segments.find(s=>s.kind==='showreel');
const chapterPositions=[0,segments[1].offset+1,reelSegment.offset+2,holds[0].offset+1,finale.offset+1];
let ready=false, targetTime=0, request=0, lastSeek=0, previousY=scrollY;
film.src=window.gooddoVideoSource(film,matchMedia('(max-width:760px)').matches?'gooddo-water-gallery-scroll-mobile.mp4':'gooddo-water-gallery-scroll-desktop.mp4');
// Ten percent overscan permits a visible look-around without exposing empty edges.
let panX=0,panY=0,panTargetX=0,panTargetY=0,panFrame=0;
let pointerX=0,pointerY=0,scrolling=false,scrollTimer;
film.style.transformOrigin='center';
film.style.transition='none';
film.style.willChange='transform';
function animatePan(){
  panFrame=0;
  panX+=(panTargetX-panX)*.09;
  panY+=(panTargetY-panY)*.09;
  film.style.transform=`translate3d(${panX}%,${panY}%,0) scale(1.10)`;
  if(Math.abs(panTargetX-panX)+Math.abs(panTargetY-panY)>.002)panFrame=requestAnimationFrame(animatePan);
}
function updatePan(){
  const enabled=!scrolling&&!reducedMotion.matches;
  panTargetX=enabled?pointerX:0;
  panTargetY=enabled?pointerY:0;
  if(!panFrame)panFrame=requestAnimationFrame(animatePan);
}
film.style.transform='scale(1.10)';
addEventListener('pointermove',event=>{
  if(event.pointerType==='touch'||event.buttons)return;
  pointerX=-(clamp(event.clientX/innerWidth)-.5)*9;
  pointerY=-(clamp(event.clientY/innerHeight)-.5)*5;
  updatePan();
},{passive:true,capture:true});
function resetPan(){pointerX=0;pointerY=0;updatePan();}
document.documentElement.addEventListener('pointerleave',resetPan);
addEventListener('blur',resetPan);
reducedMotion.addEventListener('change',updatePan);
addEventListener('scroll',()=>{
  scrolling=true;updatePan();clearTimeout(scrollTimer);
  scrollTimer=setTimeout(()=>{scrolling=false;updatePan();},180);
},{passive:true});
film.muted=true;
film.load();
function schedule(){if(!request)request=requestAnimationFrame(render);}
function render(now){
  request=0;
  if(!ready||document.hidden)return;
  if(film.seeking&&now-lastSeek<1200)return;
  const time=Math.min(targetTime,film.duration-1/24);
  if(Math.abs(film.currentTime-time)>1/60){lastSeek=now;film.currentTime=time;}
}
function goTo(position){
  scrollTo({top:journey.offsetTop+position/total*(journey.offsetHeight-innerHeight),behavior:reducedMotion.matches?'instant':'smooth'});
}
function syncScroll(){
  const progress=clamp((scrollY-journey.offsetTop)/Math.max(1,journey.offsetHeight-innerHeight));
  const forward=scrollY>previousY+1;
  previousY=scrollY;
  if(forward&&progress>=.999){scrollTo({top:journey.offsetTop,behavior:'instant'});return;}
  const position=progress*total;
  const s=segments.find(s=>position<s.offset+s.weight)||segments.at(-1);
  const p=clamp((position-s.offset)/s.weight);
  targetTime=s.start+(s.end-s.start)*p;
  const hallVisible=s.kind==='hall';
  portfolio.style.opacity=hallVisible?1:0;
  portfolio.style.transform='none';
  portfolio.inert=!hallVisible;
  portfolio.setAttribute('aria-hidden',String(!hallVisible));
  window.updateHallWalk?.(((hallVisible?s.hall:Math.max(0,s.hall))+.65)/window.GOODDO_HALLS.length,hallVisible);
  const finalVisible=s.kind==='final';
  finalScene.style.visibility=finalVisible?'visible':'hidden';
  finalScene.inert=!finalVisible;
  finalScene.setAttribute('aria-hidden',String(!finalVisible));
  const reveal=finalVisible?clamp((p-.65)/.2):0;
  finalContent.style.opacity=1-reveal;
  finalContent.inert=!finalVisible||reveal>.5;
  loopHero.style.opacity=reveal;
  loopHero.style.visibility=reveal>0?'visible':'hidden';
  loopHero.setAttribute('aria-hidden',String(reveal===0));
  film.style.opacity=1;
  const heroOpacity=s.kind==='hero'?1:s===segments[1]?1-clamp(p*5):0;
  heroCopy.style.opacity=heroOpacity;
  heroCopy.inert=heroOpacity<.1;
  // Studio facts accompany the two water clips, one at a time.
  const studioStart=clips[1].start+.8;
  const studioEnd=clips[2].end-.4;
  const span=(studioEnd-studioStart)/titles.length;
  titles.forEach((title,i)=>{
    const local=(targetTime-studioStart-i*span)/span;
    const opacity=s.kind==='travel'?clamp(local*5)*clamp((1-local)*5):0;
    title.style.opacity=opacity;
    title.style.visibility=opacity>0?'visible':'hidden';
    title.style.transform=`translateY(${(1-opacity)*18}px)`;
  });
  const services=document.getElementById('services-copy');
  services.style.opacity=0;services.inert=true;
  document.getElementById('level-transition').style.visibility='hidden';
  window.updateGlassScene?.(s.kind==='showreel'?30+p*5:0);
  document.getElementById('journey-progress').style.transform=`scaleX(${progress})`;
  journey.dataset.progress=progress.toFixed(4);
  journey.dataset.targetTime=targetTime.toFixed(3);
  journey.dataset.segment=s.kind;
  const chapter=finalVisible?4:position>=holds[0].offset?3:s.kind==='showreel'?2:position>=segments[1].offset?1:0;
  chapters.forEach((button,i)=>button.setAttribute('aria-current',i===chapter?'step':'false'));
  schedule();
}
film.addEventListener('loadeddata',()=>{ready=true;film.pause();film.classList.add('ready');loading.hidden=true;syncScroll();});
film.addEventListener('seeked',schedule);
film.addEventListener('error',()=>{loading.hidden=false;loading.textContent='Не удалось загрузить видео — обновите страницу';});
film.addEventListener('play',()=>film.pause());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncScroll();});
addEventListener('scroll',syncScroll,{passive:true});
addEventListener('resize',syncScroll);
chapters.forEach((button,i)=>button.addEventListener('click',()=>goTo(chapterPositions[i])));
document.querySelectorAll('[data-hall]').forEach(button=>button.addEventListener('click',()=>goTo(holds[Number(button.dataset.hall)].offset+1)));
document.querySelectorAll('[data-walk]').forEach(button=>button.addEventListener('click',()=>goTo(holds[Number(portfolio.dataset.hallIndex||0)].offset+1)));
syncScroll();
