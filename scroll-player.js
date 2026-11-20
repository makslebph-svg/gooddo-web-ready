// The atrium holds at rest; the first scroll begins a gradual descent.
const film = document.getElementById('scroll-film');
const journey = document.getElementById('journey');
const loading = document.getElementById('loading');
const portfolio = document.getElementById('demo');
const heroCopy = document.getElementById('hero-copy');
const finalScene = document.getElementById('final-scene');
const chapters = [...document.querySelectorAll('[data-progress]')];
const chapterNav = document.querySelector('.route-nav');
const clientsNavButton = chapterNav.querySelector('[data-route="clients"]');
let currentNavButton = chapterNav.querySelector('[aria-current="step"]');

const titles = [...document.querySelectorAll('.story-title')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = n => Math.max(0,Math.min(1,n));
const clips = window.GOODDO_VIDEO_CLIPS;
const teamConfig=window.GOODDO_TEAM;
const segments = [];
let total = 0;
function add(kind, start, end, weight, hall = -1) {
  const segment = {kind,start,end,weight,hall,offset:total};
  segments.push(segment); total += weight;
  return segment;
}
const holds=[];
let titleSegment, approachSegment, reelSegment;
// The stops and transitions share one seekable media timeline.
const frame=1/window.GOODDO_ROUTE_MEDIA.fps;
const lastFrame=clip=>clip.end-frame;
const descentEnd=clips[0].start+1.25;
add('hero',clips[0].start,descentEnd,4);
add('travel',descentEnd,lastFrame(clips[0]),clips[0].end-descentEnd);
titleSegment=add('titles',lastFrame(clips[0]),lastFrame(clips[0]),4);
const reelPoint=window.GOODDO_ROUTE_MEDIA.showreelTime;
approachSegment=add('approach',titleSegment.end,reelPoint,3);
reelSegment=add('showreel',reelPoint,reelPoint,6);
add('portal',reelPoint,lastFrame(clips[1]),clips[1].end-reelPoint,0);
holds.push(add('hall',lastFrame(clips[1]),lastFrame(clips[1]),4,0));
for(let i=2;i<=4;i++){
  // The staged hall holds on the new first frame, with the correct view inside its painting.
  const arrival=i===3?clips[4].start:lastFrame(clips[i]);
  add('travel',clips[i].start,arrival,clips[i].end-clips[i].start,i-1);
  holds.push(add('hall',arrival,arrival,4,i-1));
}
const atriumFrame=lastFrame(clips.at(-1));
const clientsEntry=clips[5];
const clientFrame=lastFrame(clientsEntry);
add('clients-entry',clientsEntry.start,clientFrame,clientsEntry.end-clientsEntry.start);
const clientsHold=add('clients',clientFrame,clientFrame,4);
const teamArrival=clips[6];
add('team-entry',teamArrival.start,teamConfig.people[0].time,teamArrival.end-teamArrival.start);
const teamHolds=[];
teamConfig.people.forEach((person,index)=>{
  const hold=add('team-hold',person.time,person.time,3.2);
  hold.teamIndex=index;teamHolds.push(hold);
  if(index<teamConfig.people.length-1){
    const clip=clips[7+index];
    const travel=add('team-travel',person.time,teamConfig.people[index+1].time,clip.end-clip.start);
    travel.teamIndex=index;travel.teamFrom=person.time;travel.teamTo=teamConfig.people[index+1].time;
  }
});
const teamExit=add('team-exit',teamConfig.people.at(-1).time,atriumFrame,clips.at(-1).end-clips.at(-1).start);
const finale=add('final',atriumFrame,atriumFrame,6);
const stagePositions=[
  0,
  titleSegment.offset+titleSegment.weight*.5,
  reelSegment.offset+reelSegment.weight*.5,
  ...holds.map(hold=>hold.offset+hold.weight*.68),
  clientsHold.offset+clientsHold.weight*.5,
  ...teamHolds.map(hold=>hold.offset+hold.weight*.68),
  finale.offset+finale.weight*.42
];
const chapterPositions=[0,titleSegment.offset+titleSegment.weight*.5,reelSegment.offset+reelSegment.weight*.5,holds[0].offset+holds[0].weight*.68,teamHolds[0].offset+teamHolds[0].weight*.68,finale.offset+finale.weight*.42];
let ready=false, targetTime=0, request=0, lastSeek=0, previousY=scrollY;
let lastRoutePosition=0;
film.poster='assets/route-v27/hero.webp';
film.src=matchMedia('(max-width:760px)').matches?window.GOODDO_ROUTE_MEDIA.mobile:window.GOODDO_ROUTE_MEDIA.desktop;
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
const routeTop=position=>journey.offsetTop+position/total*(journey.offsetHeight-innerHeight);
const routePosition=()=>clamp((scrollY-journey.offsetTop)/Math.max(1,journey.offsetHeight-innerHeight))*total;
let flight=0,flightTarget=-1,lastFlightEnd=-Infinity;
function stopFlight(){if(flight)cancelAnimationFrame(flight);flight=0;flightTarget=-1;window.stopStudioSequence?.();}
function flyTo(position,options={}){
  stopFlight();
  const from=scrollY,to=routeTop(position),distance=Math.abs(to-from);
  if(reducedMotion.matches||distance<2){scrollTo({top:to,behavior:'instant'});options.onComplete?.();return;}
  const span=Math.abs(position-routePosition());
  const current=routePosition();
  // Allocate motion time by footage travelled, not by the scroll height of a hold.
  // This avoids spending half a gesture on a still showreel/hall before moving.
  const low=Math.min(current,position),high=Math.max(current,position);
  let pieces=segments.filter(s=>s.offset<high&&s.offset+s.weight>low).map(s=>{
    const a=Math.max(low,s.offset),b=Math.min(high,s.offset+s.weight),fraction=(b-a)/s.weight;
    const seconds=s.kind==='approach'?5:Math.abs(s.end-s.start);
    const cost=Math.max(.06,(seconds||.22)*fraction);
    return {a,b,cost};
  });
  if(position<current)pieces=pieces.reverse().map(s=>({...s,a:s.b,b:s.a}));
  const motionCost=pieces.reduce((sum,s)=>sum+s.cost,0);
  const duration=Math.min(6500,Math.max(850,motionCost*1000))*(low>=titleSegment.offset?.5:1);
  const positionAt=fraction=>{
    let remaining=fraction*motionCost;
    for(const piece of pieces){if(remaining<=piece.cost)return piece.a+(piece.b-piece.a)*remaining/piece.cost;remaining-=piece.cost}
    return position;
  };
  const started=performance.now();
  flightTarget=position;
  const frame=now=>{
    const p=clamp((now-started)/duration);
    const eased=p*p*(3-2*p);
    scrollTo({top:routeTop(positionAt(eased)),behavior:'instant'});
    if(p<1)flight=requestAnimationFrame(frame);
    else{flight=0;flightTarget=-1;lastFlightEnd=performance.now();syncScroll();options.onComplete?.();}
  };
  flight=requestAnimationFrame(frame);
}
function goTo(position){flyTo(position);}
document.querySelector('#hero-showreel').addEventListener('click',()=>goTo(chapterPositions[2]));
document.querySelector('#hero-scroll').addEventListener('click',()=>advanceStage(1));
function returnToStart(){
  stopFlight();
  lastFlightEnd=performance.now();
  if(location.hash) history.replaceState(history.state,'','#home');
  scrollTo({top:routeTop(0),behavior:'instant'});
}
function advanceStage(direction){
  if(flight){
    // Trackpad inertia cannot skip a scene, but an opposite gesture reverses it.
    const moving=Math.sign(flightTarget-routePosition());
    if(direction===moving)return;
    stopFlight();
  }
  const position=routePosition();
  const tolerance=Math.max(.02,total*.0005);
  const next=direction>0
    ?stagePositions.findIndex(stop=>stop>position+tolerance)
    :stagePositions.findLastIndex(stop=>stop<position-tolerance);
  if(next<0){if(direction>0)returnToStart();return;}
  flyTo(stagePositions[next]);
}
function routeInputAllowed(target){
  return !document.querySelector('dialog[open]')
    && !document.fullscreenElement
    && !(target instanceof Element&&target.closest('input,textarea,select,[contenteditable],.route-nav,#cases-subnav'));
}
function innerScrollAvailable(target,direction){
  let area=target instanceof Element?target.closest('[data-route-scroll]'):null;
  while(area){
    if(direction>0?area.scrollTop+area.clientHeight<area.scrollHeight-2:area.scrollTop>2)return true;
    area=area.parentElement?.closest('[data-route-scroll]');
  }
  return false;
}
function clientReadingTarget(target){
  return journey.dataset.segment==='clients'&&target instanceof Element&&!!target.closest('#clients-scene .clients-reading-zone,.review-dialog');
}
let lastWheelEvent=-Infinity;
addEventListener('wheel',event=>{
  if(event.defaultPrevented||event.ctrlKey||!routeInputAllowed(event.target)||Math.abs(event.deltaY)<2||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
  if(clientReadingTarget(event.target)){
    if(innerScrollAvailable(event.target,Math.sign(event.deltaY)))return;
    event.preventDefault();return;
  }
  if(journey.dataset.segment!=='clients'&&innerScrollAvailable(event.target,Math.sign(event.deltaY)))return;
  if(scrollY<journey.offsetTop-2||scrollY>journey.offsetTop+journey.offsetHeight-innerHeight+2)return;
  event.preventDefault();
  const now=performance.now(),newGesture=now-lastWheelEvent>130;lastWheelEvent=now;
  if(!flight&&!newGesture&&now-lastFlightEnd<180)return;
  advanceStage(Math.sign(event.deltaY));
},{passive:false});
addEventListener('keydown',event=>{
  if(event.defaultPrevented||!routeInputAllowed(event.target)||event.altKey||event.ctrlKey||event.metaKey)return;
  if(event.key===' '&&event.target.closest?.('button,a,summary'))return;
  const direction=['ArrowDown','PageDown',' '].includes(event.key)?1:['ArrowUp','PageUp'].includes(event.key)?-1:0;
  if(!direction)return;
  if(clientReadingTarget(event.target)){
    if(innerScrollAvailable(event.target,direction))return;
    event.preventDefault();return;
  }
  if(journey.dataset.segment!=='clients'&&innerScrollAvailable(event.target,direction))return;
  event.preventDefault();
  advanceStage(direction);
});
let touchStart=null;
addEventListener('touchstart',event=>{
  if(event.touches.length!==1||!routeInputAllowed(event.target)||scrollY<journey.offsetTop-2||scrollY>journey.offsetTop+journey.offsetHeight-innerHeight+2){touchStart=null;return;}
  touchStart={x:event.touches[0].clientX,y:event.touches[0].clientY,target:event.target,native:false,reading:clientReadingTarget(event.target)};
},{passive:true});
addEventListener('touchmove',event=>{
  if(!touchStart||event.touches.length!==1)return;
  const dx=event.touches[0].clientX-touchStart.x,dy=event.touches[0].clientY-touchStart.y;
  if((touchStart.reading||journey.dataset.segment!=='clients')&&innerScrollAvailable(touchStart.target,dy<0?1:-1)){touchStart.native=true;return}
  if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>6)event.preventDefault();
},{passive:false});
addEventListener('touchend',event=>{
  if(!touchStart||!event.changedTouches.length)return;
  const dx=event.changedTouches[0].clientX-touchStart.x,dy=event.changedTouches[0].clientY-touchStart.y;
  const native=touchStart.native||touchStart.reading;
  touchStart=null;
  if(native)return;
  if(Math.abs(dy)>35&&Math.abs(dy)>Math.abs(dx)*1.2)advanceStage(dy<0?1:-1);
},{passive:true});
function syncScroll(){
  const progress=clamp((scrollY-journey.offsetTop)/Math.max(1,journey.offsetHeight-innerHeight));
  const forward=scrollY>previousY+1;
  previousY=scrollY;
  if(forward&&progress>=.999){returnToStart();return;}
  const position=progress*total;
  lastRoutePosition=position;
  const s=segments.find(s=>position<s.offset+s.weight)||segments.at(-1);
  const p=clamp((position-s.offset)/s.weight);
  document.body.classList.toggle('route-flight',!!flight);
  document.body.classList.toggle('in-cases',s.kind==='hall');
  targetTime=s.start+(s.end-s.start)*p;
  window.updateStudioSequence?.(s,p);
  window.updateTeamRoute?.(s,p);
  window.GooddoClients?.render(s.kind==='clients'?1:0);
  window.updateCasesNavigation?.(s,!!flight);
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
  film.style.opacity=1;
  const reelBlur=s.kind==='approach'?5*clamp((p-.12)/.88):s.kind==='showreel'?5:s.kind==='portal'?5*(1-clamp(p/.28)):0;
  journey.style.setProperty('--route-reel-blur',`${reelBlur.toFixed(2)}px`);
  const heroOpacity=s.kind==='hero'?1-clamp((p-.1)/.75):0;
  heroCopy.style.opacity=heroOpacity;
  heroCopy.inert=heroOpacity<.1;
  const factsOpacity=s.kind==='titles'?clamp(p/.18)*clamp((1-p)/.15):s.kind==='approach'?1-clamp(p/.12):0;
  const facts=document.getElementById('story-titles');
  facts.style.setProperty('--studio-wash','0');
  facts.style.setProperty('--facts-opacity',factsOpacity);
  facts.inert=factsOpacity<.1;facts.setAttribute('aria-hidden',String(factsOpacity<.1));
  titles.forEach((title,i)=>{
    const opacity=factsOpacity;
    title.style.opacity=opacity;
    title.style.visibility=opacity>0?'visible':'hidden';
    title.style.transform=`translateY(${(1-opacity)*18}px)`;
  });
  const services=document.getElementById('services-copy');
  services.style.opacity=0;services.inert=true;
  document.getElementById('level-transition').style.visibility='hidden';
  window.updateGlassScene?.(s.kind==='showreel'?p:-1);
  document.getElementById('journey-progress').style.transform=`scaleX(${progress})`;
  journey.dataset.progress=progress.toFixed(4);
  journey.dataset.targetTime=targetTime.toFixed(3);
  journey.dataset.segment=s.kind;
  const chapter=finalVisible?5:s.kind.startsWith('team-')?4:position>=holds[0].offset?3:position>=approachSegment.offset?2:position>=titleSegment.offset?1:0;
  const activeButton = s.kind === 'clients' ? clientsNavButton : chapters[chapter];
  if (activeButton !== currentNavButton) {
    currentNavButton?.removeAttribute('aria-current');
    activeButton.setAttribute('aria-current', 'step');
    currentNavButton = activeButton;
    if (chapterNav.scrollWidth > chapterNav.clientWidth) {
      const navBounds = chapterNav.getBoundingClientRect();
      const buttonBounds = activeButton.getBoundingClientRect();
      if (buttonBounds.left < navBounds.left) chapterNav.scrollLeft += buttonBounds.left - navBounds.left;
      else if (buttonBounds.right > navBounds.right) chapterNav.scrollLeft += buttonBounds.right - navBounds.right;
    }
  }
  schedule();
}
film.addEventListener('loadeddata',()=>{ready=true;film.pause();film.classList.add('ready');loading.hidden=true;syncScroll();});
film.addEventListener('seeked',schedule);
film.addEventListener('error',()=>{loading.hidden=false;loading.textContent='Не удалось загрузить видео — обновите страницу';});
film.addEventListener('play',()=>film.pause());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncScroll();});
addEventListener('scroll',syncScroll,{passive:true});
addEventListener('resize',()=>{
  stopFlight();
  scrollTo({top:routeTop(lastRoutePosition),behavior:'instant'});
  syncScroll();
});
chapters.forEach((button,i)=>{if(button.id!=='cases-nav-trigger')button.addEventListener('click',()=>goTo(chapterPositions[i]))});
document.querySelectorAll('[data-hall]').forEach(button=>button.addEventListener('click',()=>{
  const hold = holds[Number(button.dataset.hall)];
  goTo(hold.offset + hold.weight * .68);
}));
document.querySelectorAll('[data-walk]').forEach(button=>button.addEventListener('click',()=>goTo(holds[Number(portfolio.dataset.hallIndex||0)].offset+holds[0].weight*.68)));
syncScroll();
function restoreRouteSection(){
  const sections={home:0,studio:1,showreel:2,portfolio:3,team:4,contacts:5};
  const key=location.hash.slice(1);
  if(key==='clients'){stopFlight();scrollTo({top:routeTop(clientsHold.offset+clientsHold.weight*.5),behavior:'instant'});syncScroll();return}
  if(key==='cases'){stopFlight();scrollTo({top:routeTop(chapterPositions[3]),behavior:'instant'});syncScroll();return}
  if(Object.hasOwn(sections,key)){
    stopFlight();scrollTo({top:routeTop(chapterPositions[sections[key]]),behavior:'instant'});syncScroll();
  }
}
film.addEventListener('loadeddata',restoreRouteSection);
addEventListener('hashchange',restoreRouteSection);

