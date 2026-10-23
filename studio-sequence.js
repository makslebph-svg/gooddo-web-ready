// Finite continuous studio passage, using a retimed copy of the existing footage.
(() => {
  const video=document.createElement('video');
  video.id='studio-flight';video.muted=true;video.playsInline=true;
  video.preload='auto';video.disablePictureInPicture=true;
  video.setAttribute('aria-hidden','true');
  video.src=matchMedia('(max-width:760px)').matches?'assets/studio-flight-slow-mobile.mp4':'assets/studio-flight-slow.mp4';
  film.after(video);
  let running=false,ending=false,started=false,generation=0;
  const sourceStart=titleSegment.start,sourceEnd=approachSegment.end;
  const sourceToPosition=time=>time<titleSegment.end
    ?titleSegment.offset+titleSegment.weight*clamp((time-titleSegment.start)/(titleSegment.end-titleSegment.start))
    :approachSegment.offset+approachSegment.weight*clamp((time-approachSegment.start)/(approachSegment.end-approachSegment.start));
  function hide(){video.style.opacity='0';video.style.visibility='hidden'}
  window.stopStudioSequence=()=>{
    generation++;running=false;ending=false;started=false;video.pause();hide();
    journey.dataset.studioPlaying='false';
  };
  window.updateStudioSequence=()=>{
    if(running&&started){
      // Prepare the exact main-film frame behind the dedicated smooth passage.
      targetTime=reelSegment.start;
      video.style.visibility='visible';video.style.opacity='1';
    }else if(ending){
      if(!film.seeking&&Math.abs(film.currentTime-reelSegment.start)<.08){ending=false;hide()}
    }else hide();
  };
  film.addEventListener('seeked',()=>{if(ending)window.updateStudioSequence()});
  window.playStudioSequence=async position=>{
    stopFlight();const token=++generation;
    running=true;ending=false;started=false;flightTarget=chapterPositions[2];
    journey.dataset.studioPlaying='true';
    const tick=()=>{
      if(token!==generation||!running)return;
      if(started&&!document.hidden){
        const progress=clamp(video.currentTime/video.duration);
        // Gentle entry and final braking, with uniform travel between captions.
        const entryRate=Math.min(1,.45+video.currentTime/.6*.55);
        const exitRate=Math.min(1,.3+(video.duration-video.currentTime)/.8*.7);
        video.playbackRate=Math.min(entryRate,exitRate);
        scrollTo({top:routeTop(sourceToPosition(sourceStart+(sourceEnd-sourceStart)*progress)),behavior:'instant'});
        if(video.ended||progress>=.999){
          video.pause();running=false;ending=true;flight=0;flightTarget=-1;
          lastFlightEnd=performance.now();journey.dataset.studioPlaying='false';
          scrollTo({top:routeTop(chapterPositions[2]),behavior:'instant'});syncScroll();return;
        }
      }
      flight=requestAnimationFrame(tick);
    };
    flight=requestAnimationFrame(tick);
    try{
      if(video.readyState<2)await new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>reject(Error('Studio video timeout')),15000);
        video.addEventListener('loadeddata',()=>{clearTimeout(timer);resolve()},{once:true});
        video.addEventListener('error',()=>{clearTimeout(timer);reject(Error('Studio video unavailable'))},{once:true});
      });
      if(token!==generation)return;
      let sourceTime=sourceStart;
      if(position>=approachSegment.offset)sourceTime=approachSegment.start+(approachSegment.end-approachSegment.start)*clamp((position-approachSegment.offset)/approachSegment.weight);
      else if(position>=titleSegment.offset)sourceTime=titleSegment.start+(titleSegment.end-titleSegment.start)*clamp((position-titleSegment.offset)/titleSegment.weight);
      video.currentTime=clamp((sourceTime-sourceStart)/(sourceEnd-sourceStart))*video.duration;
      video.playbackRate=video.currentTime<.6?.45:1;
      await video.play();
      if(token!==generation){video.pause();return}
      started=true;syncScroll();
    }catch(error){
      if(token!==generation)return;
      document.getElementById('status').textContent='Плавный пролёт недоступен — используется исходный ролик';
      flyTo(chapterPositions[2],{skipStudio:true});
    }
  };
  document.addEventListener('visibilitychange',()=>{
    if(!running||!started)return;
    if(document.hidden)video.pause();else video.play().catch(()=>{});
  });
  reducedMotion.addEventListener('change',()=>{
    if(running&&reducedMotion.matches){stopFlight();scrollTo({top:routeTop(chapterPositions[2]),behavior:'instant'});syncScroll()}
  });
})();
