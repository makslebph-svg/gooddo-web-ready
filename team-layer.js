(() => {
  const config=window.GOODDO_TEAM;
  const room=document.getElementById('team-room');
  const media=document.getElementById('scroll-film');
  const journey = document.getElementById('journey');
  const clamp=p=>Math.max(0,Math.min(1,p));
  const captions=config.people.map(person=>{
    const article=document.createElement('article');
    article.className='team-caption';article.dataset.person=person.id;
    if (person.caption.align) article.dataset.align = person.caption.align;
    const name=document.createElement('h2');name.textContent=person.name;
    const role=document.createElement('p');role.textContent=person.role;
    article.append(name,role);room.append(article);return article;
  });
  function placeCaption(caption,person){
    const width = innerWidth;
    const height = innerHeight;
    const menuBottom = document.querySelector('.route-hud').getBoundingClientRect().bottom;
    const anchor = person.caption;
    const mobile = width <= 760;

    // Desktop anchors use the uncropped video frame. Phone anchors use its visible crop.
    const scale = Math.max(width / 1920, height / 1080);
    const filmWidth = 1920 * scale;
    const filmHeight = 1080 * scale;
    const captionWidth = mobile ? width - 36 : Math.min(430, anchor.w * filmWidth, width - 40);
    const x = mobile ? 18 : anchor.x * filmWidth - (filmWidth - width) / 2;
    const y = mobile ? height * anchor.mobileY : anchor.y * filmHeight - (filmHeight - height) / 2;
    caption.style.width = captionWidth + 'px';
    Object.assign(caption.style, {
      left: Math.max(mobile ? 18 : 20, Math.min(width - captionWidth - 18, x)) + 'px',
      right: 'auto',
      top: Math.max(menuBottom + 12, Math.min(height - caption.offsetHeight - 20, y)) + 'px',
      bottom: 'auto'
    });
  }
  window.updateTeamRoute=(segment,p)=>{
    const active=segment.kind.startsWith('team-');
    // Fade the grade only as the camera enters or leaves the team room.
    const gradeIn = clamp((p - .38) / .25);
    const gradeOut = 1 - clamp((p - .31) / .17);
    const grade = segment.kind === 'team-entry' ? gradeIn
      : segment.kind === 'team-exit' ? gradeOut : Number(active);
    journey.style.setProperty('--team-grade', grade.toFixed(3));
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
    room.style.setProperty('--team-caption-opacity', String(holdOpacity));
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
