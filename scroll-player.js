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
let titleSegment, approachSegment, reelSegment, portalSegment;
clips.forEach((clip,i) => {
  // Reverse only the daylight clip; all subsequent passages keep their direction.
  if(i===2){
    // Stop while the painting is still clearly visible in the gallery.
    const painting=clip.start+3.5;
    approachSegment=add('approach',clip.start,painting,3.5);
    reelSegment=add('showreel',painting,painting,6);
    // Give the painting entry its own scroll range before revealing the next hall.
    portalSegment=add('portal',painting,painting,4.5);
    add('travel',clip.start+4.5,clip.end-1/24,3.5);
  }else add(i===0?'hero':'travel',i===0?clip.end-1/24:clip.start,i===0?clip.start:clip.end-1/24,clip.end-clip.start,i>=3&&i<=7?i-3:-1);
  if(i===1)titleSegment=add('titles',clip.end-1/24,clip.end-1/24,4);
  if(i>=2&&i<=6) holds.push(add('hall',clip.end-1/24,clip.end-1/24,4,i-2));
});
const finale=add('final',clips.at(-1).end-1/24,clips.at(-1).end-1/24,6);
const chapterPositions=[0,titleSegment.offset+.3,reelSegment.offset+1,holds[0].offset+1,finale.offset+1];
let ready=false, targetTime=0, request=0, lastSeek=0, previousY=scrollY;
film.src=window.gooddoVideoSource(film,matchMedia('(max-width:760px)').matches?'gooddo-water-gallery-scroll-mobile.mp4':'gooddo-water-gallery-scroll-desktop.mp4')+'?v=show-return-1';
const portalWash=document.createElement('div');
portalWash.className='painting-portal-wash';
film.after(portalWash);
// Ten percent overscan permits a visible look-around without exposing empty edges.
let panX=0,panY=0,panTargetX=0,panTargetY=0,panFrame=0,portalProgress=-1;
let pointerX=0,pointerY=0,scrolling=false,scrollTimer;
film.style.transformOrigin='center';
film.style.transition='none';
film.style.willChange='transform';
function animatePan(){
  panFrame=0;
  if(portalProgress>=0){
    const eased=portalProgress*portalProgress*(3-2*portalProgress);
    const scale=1.10+8.4*eased;
    film.style.transform=`translate3d(${-22*scale*eased}%,${-8*scale*eased}%,0) scale(${scale})`;
    return;
  }
  panX+=(panTargetX-panX)*.09;
  panY+=(panTargetY-panY)*.09;
  film.style.transform=`translate3d(${panX}%,${panY}%,0) scale(1.10)`;
  if(Math.abs(panTargetX-panX)+Math.abs(panTargetY-panY)>.002)panFrame=requestAnimationFrame(animatePan);
}
function updatePan(){
  const enabled=!scrolling&&!reducedMotion.matches&&journey.dataset.segment!=='showreel'&&journey.dataset.segment!=='portal';
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
  if(film.seeking&&now-lastSeek<450)return;
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
  titles.forEach((title,i)=>{
    const local=s.kind==='titles' ? p*titles.length-i : -1;
    const opacity=s.kind==='titles'?clamp(local*6)*clamp((1-local)*6):0;
    title.style.opacity=opacity;
    title.style.visibility=opacity>0?'visible':'hidden';
    title.style.transform=`translateY(${(1-opacity)*18}px)`;
  });
  const services=document.getElementById('services-copy');
  services.style.opacity=0;services.inert=true;
  document.getElementById('level-transition').style.visibility='hidden';
  window.updateGlassScene?.(s.kind==='showreel'?p:-1);
  portalProgress=s.kind==='portal'?p:-1;
  portalWash.style.opacity=s.kind==='portal'?clamp((p-.72)/.23):s.kind==='travel'&&s.offset===portalSegment.offset+portalSegment.weight?1-clamp(p/.18):0;
  document.getElementById('journey-progress').style.transform=`scaleX(${progress})`;
  journey.dataset.progress=progress.toFixed(4);
  journey.dataset.targetTime=targetTime.toFixed(3);
  journey.dataset.segment=s.kind;
  updatePan();
  const chapter=finalVisible?4:position>=holds[0].offset?3:position>=approachSegment.offset?2:position>=titleSegment.offset?1:0;
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
