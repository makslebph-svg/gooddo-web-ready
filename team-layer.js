(() => {
  const config=window.GOODDO_TEAM;
  const room=document.getElementById('team-room');
  const film=document.getElementById('team-film');
  const fallback=document.getElementById('team-fallback');
  const captions=[...room.querySelectorAll('[data-person]')];
  const clamp=p=>Math.max(0,Math.min(1,p));
  const ease=p=>p*p*(3-2*p);
  const mp4=matchMedia('(max-width:760px)').matches?config.mobileVideo:config.video;
  let started=false,ready=false,desired=0,request=0,failed=false,triedMp4=false;
  function queue(){
    if(request)return;
    request=requestAnimationFrame(()=>{
      request=0;if(!ready||film.seeking||document.hidden)return;
      const time=Math.max(0,Math.min(desired,film.duration-1/config.fps));
      if(Math.abs(film.currentTime-time)>1/(config.fps*2))film.currentTime=time;
    });
  }
  function load(){
    if(started)return;started=true;
    film.src=window.gooddoVideoSource(film,mp4);film.preload='auto';film.load();
  }
  window.updateTeamRoute=(segment,p)=>{
    const active=segment.kind.startsWith('team-');
    if(active||(segment.kind==='hall'&&segment.hall===4))load();
    let opacity=0,index=segment.teamIndex||0,crop=config.people[index].crop;
    if(segment.kind==='team-entry'){opacity=ease(p);desired=0;index=0}
    else if(segment.kind==='team-hold'){opacity=1;desired=config.people[index].time}
    else if(segment.kind==='team-travel'){
      opacity=1;desired=segment.teamFrom+(segment.teamTo-segment.teamFrom)*p;
      crop=config.people[index].crop+(config.people[index+1].crop-config.people[index].crop)*p;
      if(p>.5)index++;
    }else if(segment.kind==='team-exit'){
      opacity=1-ease(p);index=config.people.length-1;desired=config.people[index].time;crop=config.people[index].crop;
    }
    room.style.opacity=opacity;room.style.visibility=opacity>0?'visible':'hidden';
    room.setAttribute('aria-hidden',String(!active));room.inert=!active;
    room.style.setProperty('--team-frame-x',crop+'%');
    const poster=config.people[index].poster;
    if((!ready||failed)&&fallback.getAttribute('src')!==poster)fallback.src=poster;
    captions.forEach((caption,i)=>{
      const visible=segment.kind==='team-hold'&&i===segment.teamIndex;
      const a=visible?clamp(p/.16)*clamp((1-p)/.12):0;
      caption.style.opacity=a;caption.style.visibility=a>0?'visible':'hidden';
      caption.style.transform=`translateY(${(1-a)*12}px)`;
      caption.setAttribute('aria-hidden',String(a<.5));
    });
    room.dataset.person=segment.kind==='team-hold'?config.people[segment.teamIndex].id:'';
    room.dataset.targetTime=desired.toFixed(3);room.dataset.transition=segment.kind;
    if(active)queue();
  };
  film.addEventListener('loadeddata',()=>{ready=true;failed=false;film.pause();film.classList.add('ready');queue()});
  film.addEventListener('seeked',queue);
  film.addEventListener('play',()=>film.pause());
  film.addEventListener('error',()=>{
    if(!triedMp4&&film.getAttribute('src')!==mp4){triedMp4=true;film.src=mp4;film.load();return}
    failed=true;ready=false;film.classList.remove('ready');
  });
})();
