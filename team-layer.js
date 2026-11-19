(() => {
  const config=window.GOODDO_TEAM;
  const room=document.getElementById('team-room');
  const media=document.getElementById('scroll-film');
  const clamp=p=>Math.max(0,Math.min(1,p));
  const captions=config.people.map(person=>{
    const article=document.createElement('article');
    article.className='team-caption';article.dataset.person=person.id;
    const name=document.createElement('h2');name.textContent=person.name;
    const role=document.createElement('p');role.textContent=person.role;
    article.append(name,role);room.append(article);return article;
  });
  function placeCaption(caption,person){
    const w=innerWidth,h=innerHeight;
    if(w<=760){
      Object.assign(caption.style,{left:'18px',right:'18px',top:'auto',bottom:'24px',width:'auto'});
      return;
    }
    const scale=Math.max(w/1920,h/1080),vw=1920*scale,vh=1080*scale;
    const width=Math.min(430,person.plate.w*vw,w-40);
    caption.style.width=width+'px';
    const menuBottom=document.querySelector('.route-hud').getBoundingClientRect().bottom;
    const x=person.plate.x*vw-(vw-w)*.5;
    const y=person.plate.y*vh-(vh-h)*.5;
    Object.assign(caption.style,{
      left:Math.max(20,Math.min(w-width-20,x))+'px',right:'auto',bottom:'auto',
      top:Math.max(menuBottom+12,Math.min(h-caption.offsetHeight-20,y))+'px'
    });
  }
  window.updateTeamRoute=(segment,p)=>{
    const active=segment.kind.startsWith('team-');
    const index=segment.teamIndex||0;
    let crop=50;
    if(segment.kind==='team-entry')crop=50+(config.people[0].crop-50)*p;
    else if(segment.kind==='team-travel')crop=config.people[index].crop+(config.people[index+1].crop-config.people[index].crop)*p;
    else if(segment.kind==='team-hold')crop=config.people[index].crop;
    else if(segment.kind==='team-exit')crop=config.people.at(-1).crop+(50-config.people.at(-1).crop)*p;
    media.style.objectPosition=innerWidth<=760?crop+'% 50%':'50% 50%';
    room.style.opacity=active?'1':'0';room.style.visibility=active?'visible':'hidden';
    room.inert=!active;room.setAttribute('aria-hidden',String(!active));
    const hold=segment.kind==='team-hold';
    const holdOpacity=hold?clamp(p/.16)*clamp((1-p)/.12):0;
    captions.forEach((caption,i)=>{
      const visible=hold&&i===index;
      const opacity=visible?holdOpacity:0;
      caption.style.opacity=String(opacity);caption.style.visibility=opacity>0?'visible':'hidden';
      caption.setAttribute('aria-hidden',String(opacity<.5));
      if(visible)placeCaption(caption,config.people[i]);
    });
    room.dataset.person=segment.kind==='team-hold'?config.people[index].id:'';
    room.dataset.transition=segment.kind;
    room.dataset.targetTime=(segment.start+(segment.end-segment.start)*p).toFixed(3);
  };
})();
