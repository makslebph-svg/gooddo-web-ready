(() => {
  const hud=document.querySelector('.route-hud');
  const trigger=document.getElementById('cases-nav-trigger');
  const subnav=document.getElementById('cases-subnav');
  document.querySelectorAll('.gooddo-project-form .t-input').forEach(input=>input.removeAttribute('placeholder'));
  let closeTimer;
  function expand(value){
    clearTimeout(closeTimer);
    hud.classList.toggle('cases-menu-open',value);
    trigger.setAttribute('aria-expanded',String(value||document.body.classList.contains('in-cases')));
  }
  trigger.addEventListener('click',()=>expand(!hud.classList.contains('cases-menu-open')));
  trigger.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')expand(true)});
  subnav.addEventListener('pointerenter',()=>clearTimeout(closeTimer));
  hud.addEventListener('pointerleave',()=>{closeTimer=setTimeout(()=>expand(false),180)});
  trigger.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'){event.preventDefault();expand(true);subnav.querySelector('button').focus()}
  });
  subnav.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const buttons=[...subnav.querySelectorAll('button')],i=buttons.indexOf(document.activeElement);
    buttons[event.key==='Home'?0:event.key==='End'?buttons.length-1:(i+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length].focus();
  });
  subnav.addEventListener('click',event=>{if(event.target.closest('button')){event.target.blur();expand(false)}});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.querySelector('dialog[open]')){expand(false);if(subnav.contains(document.activeElement))trigger.focus()}});
  document.addEventListener('click',event=>{if(!hud.contains(event.target))expand(false)});
  document.querySelector('[data-route="clients"]').addEventListener('click',()=>goTo(clientsHold.offset+clientsHold.weight*.5));
  const brand=document.querySelector('.route-brand');
  brand.href='#home';brand.removeAttribute('target');brand.setAttribute('aria-label','GoodDo — главная');
  window.updateCasesNavigation=(segment,moving)=>{
    const visible=segment.kind==='hall'&&!moving;
    trigger.setAttribute('aria-expanded',String(!moving&&(visible||hud.classList.contains('cases-menu-open'))));
    subnav.querySelectorAll('button').forEach(button=>button.setAttribute('aria-current',visible&&Number(button.dataset.hall)===segment.hall?'step':'false'));
  };
  syncScroll();
})();
