(() => {
  const logos=[['LARNILANE','larnilane.svg'],['DEPARTÁMENT','departament.svg'],['OMODA','omoda.svg'],['Т-Банк','tbank.png'],['Сбер','sber.svg'],['Hongqi','hongqi.png'],['CHERY','chery.svg'],['Москва 2030','moscow2030.png'],['Bentley','bentley.svg'],['Mercedes-Benz','mercedes.svg']];
  const reviews=[
    {name:'Ия Кононович',role:'PR Manager, Now agency',text:'Стилево, динамично! С музыкой и визуалом и кей вижалом приятно круто отыгрывается идея и концепт проекта. Спасибо огромное, что добили, докрутили, дособирали его!'},
    {name:'Пётр Иванов',role:'Режиссёр и сценарист, ex креативный директор DEPARTAMENT',text:'Ребята, спасибо ещё раз! Талантливая и оперативная команда — большая редкость'},
    {name:'Екатерина',role:'HRD компании Телеком Биржа',text:'Спасибо за два дня драйва и профессионализма! Съёмки прошли легко и непринуждённо. Вы смогли уловить и передать дух нашей компании. Мы получили не просто HR-ролик, а настоящую порцию вдохновения и позитива!'},
    {name:'Тигран Оганян',role:'Руководитель отдела проектов, агентство LARNILANE',text:'Рамиль, видос, на самом деле, просто пушка вышел!'},
    {name:'Юлия Плетина',role:'Отдел маркетинга OMODA',text:'Пушка! Получилось идеально!'},
    {name:'Игорь Демидов',role:'CEO & Co-Founder, Now agency',text:'Мне очень нравится! Рамиль — Топ! Огромное спасибо тебе'}
  ];
  const portraits=['03_Iya_Kononovich','02_Petr_Ivanov','05_Ekaterina','04_Tigran_Oganyan','06_Yulia_Pletina','01_Igor_Demidov'];
  const scene=document.createElement('section');scene.id='clients-scene';scene.className='clients-scene';scene.setAttribute('aria-label','Клиенты и отзывы');scene.setAttribute('aria-hidden','true');scene.inert=true;
  scene.innerHTML=`<div class="clients-content" data-route-scroll>
    <header class="clients-heading"><span class="eyebrow">GOODDO / КЛИЕНТЫ</span><h2>Нам доверяют</h2></header>
    <div class="reviews-carousel clients-reading-zone" tabindex="0" role="region" aria-roledescription="карусель" aria-label="Отзывы клиентов — перетаскивайте карточки или используйте стрелки">
    ${reviews.map((r,i)=>`<article class="client-review" data-review="${i}" aria-label="Отзыв ${i+1} из ${reviews.length}" tabindex="-1"><span class="review-quote" aria-hidden="true">“</span><div class="review-copy"><blockquote>${r.text}</blockquote></div><div class="review-author"><img src="assets/review-portraits/${portraits[i]}.webp" alt="${r.name}" decoding="async"><div><strong>${r.name}</strong><span>${r.role}</span></div></div></article>`).join('')}
    </div>
    <div class="review-navigation clients-reading-zone"><button class="review-prev" aria-label="Предыдущий отзыв">‹</button><div class="review-progress" aria-hidden="true"><span></span></div><span class="review-counter" aria-live="polite">01 / 06</span><button class="review-next" aria-label="Следующий отзыв">›</button></div>
    <div class="client-logo-strip clients-reading-zone" data-route-scroll tabindex="0" aria-label="Наши клиенты">${logos.map(([name,file])=>`<div class="client-logo"><img src="assets/clients/${file.replace(/\.(svg|png)$/, '-light.png')}" alt="${name}" decoding="async"></div>`).join('')}</div>
    <div class="clients-end">Прокрутите вне карточек, чтобы продолжить</div>
  </div>`;
  document.querySelector('#journey .stage').appendChild(scene);
  const content = scene.querySelector('.clients-content');
  const smallScreen = matchMedia('(max-width:760px)');
  // On short phone screens let the section scroll to its last row of logos.
  content.addEventListener('wheel', event => {
    if (!smallScreen.matches) return;
    const canScroll = event.deltaY > 0
      ? content.scrollTop + content.clientHeight < content.scrollHeight - 1
      : content.scrollTop > 0;
    if (canScroll) event.stopPropagation();
  });
  const carousel=scene.querySelector('.reviews-carousel'),cards=[...scene.querySelectorAll('.client-review')];
  let index=1,wheelAt=0,drag=null,suppressClickUntil=0;
  function select(next){index=(next+reviews.length)%reviews.length;cards.forEach((card,i)=>{let delta=(i-index+reviews.length)%reviews.length;if(delta>reviews.length/2)delta-=reviews.length;const visible=Math.abs(delta)<=1;card.dataset.position=delta===0?'current':delta===-1?'previous':delta===1?'next':'hidden';card.setAttribute('aria-hidden',String(!visible));card.inert=!visible;card.tabIndex=visible&&delta!==0?0:-1;});scene.querySelector('.review-counter').textContent=String(index+1).padStart(2,'0')+' / 06';scene.querySelector('.review-progress span').style.width=((index+1)/reviews.length*100)+'%';}
  select(index);
  scene.querySelector('.review-prev').addEventListener('click',()=>select(index-1));scene.querySelector('.review-next').addEventListener('click',()=>select(index+1));
  cards.forEach((card,i)=>{card.addEventListener('click',event=>{if(performance.now()<suppressClickUntil){event.preventDefault();return;}if(card.dataset.position!=='current'&&!event.target.closest('button'))select(i)});card.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&card.dataset.position!=='current'){event.preventDefault();select(i)}})});
  scene.querySelectorAll('.clients-reading-zone').forEach(zone=>zone.addEventListener('wheel',event=>{
    if(smallScreen.matches&&zone.classList.contains('client-logo-strip'))return;
    event.stopPropagation();
    if(zone.classList.contains('client-logo-strip')){event.preventDefault();zone.scrollLeft+=Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY;return;}event.preventDefault();const now=performance.now();if(Math.abs(event.deltaY)<8||now-wheelAt<650)return;wheelAt=now;select(index+(event.deltaY>0?1:-1));
  },{passive:false}));
  carousel.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();event.stopPropagation();select(index+(event.key==='ArrowRight'?1:-1));}});
  carousel.addEventListener('pointerdown',event=>{if(event.button!==0||event.target.closest('button'))return;drag={x:event.clientX,y:event.clientY,id:event.pointerId};});
  carousel.addEventListener('pointerup',event=>{if(!drag||event.pointerId!==drag.id)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;drag=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.2){suppressClickUntil=performance.now()+400;select(index+(dx<0?1:-1));}});
  carousel.addEventListener('pointercancel',()=>drag=null);carousel.addEventListener('dragstart',event=>event.preventDefault());
  window.GooddoClients={render(opacity){const active=opacity>.01;scene.style.opacity=String(opacity);scene.style.visibility=active?'visible':'hidden';scene.style.pointerEvents=opacity>.95?'auto':'none';scene.inert=opacity<=.95;scene.setAttribute('aria-hidden',String(!active));}};
})();
