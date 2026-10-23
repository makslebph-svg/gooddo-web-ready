(() => {
  const logos=[['LARNILANE','larnilane.svg'],['DEPARTÁMENT','departament.svg'],['OMODA','omoda.svg'],['Т-Банк','tbank.png'],['Сбер','sber.svg'],['Hongqi','hongqi.png'],['CHERY','chery.svg'],['Москва 2030','moscow2030.png'],['Bentley','bentley.svg'],['Mercedes-Benz','mercedes.svg']];
  const reviews=[
    {name:'Ия Кононович',role:'PR Manager, Now agency',text:'Стилево, динамично! С музыкой и визуалом и кей вижалом приятно круто отыгрывается идея и концепт проекта. Спасибо огромное, что добили, докрутили, дособирали его!'},
    {name:'Пётр Иванов',role:'Режиссёр и сценарист, ex креативный директор DEPARTAMENT',text:'Ребята, спасибо ещё раз! Талантливая и оперативная команда — большая редкость'},
    {name:'Екатерина',role:'HRD компании Телеком Биржа',text:'От себя лично и от всей команды хочу сказать огромное СПАСИБО за два дня абсолютного драйва и профессионализма! Мы получили не просто HR-ролик, а настоящую порцию вдохновения и позитива, которая зарядила всех — от коллег до пушистых членов нашей команды)',more:'Процесс съемки был настолько комфортным и непринужденным, что мы даже не заметили, как пролетело время. Будь то в офисе, среди наших привычных рабочих будней, или на выездных локациях — ваша команда создавала атмосферу полного доверия и легкости. Это дорогого стоит! Мы в восторге от подхода, энергии и от того, как вы смогли уловить и передать дух нашей компании. Вы — настоящие мастера своего дела, которые умеют работать не только с камерой, но и с людьми! Благодарим за ценнейший опыт, позитивные эмоции и за то, что сделали этот проект таким особенным!'},
    {name:'Тигран Оганян',role:'Руководитель отдела проектов, агентство LARNILANE',text:'Рамиль, видос, на самом деле, просто пушка вышел!'},
    {name:'Юлия Плетина',role:'Отдел маркетинга OMODA',text:'Пушка! Получилось идеально!'},
    {name:'Игорь Демидов',role:'CEO & Co-Founder, Now agency',text:'Мне очень нравится! Рамиль — Топ! Огромное спасибо тебе'}
  ];
  const scene=document.createElement('section');scene.id='clients-scene';scene.className='clients-scene';scene.setAttribute('aria-label','Клиенты и отзывы');scene.setAttribute('aria-hidden','true');scene.inert=true;
  scene.innerHTML=`<div class="clients-scroll" data-route-scroll tabindex="0" aria-label="Клиенты и отзывы"><div class="clients-content">
    <header class="clients-heading"><div><span class="eyebrow">GOODDO / КЛИЕНТЫ</span><h2>Нам доверяют</h2></div><p>Ответственность, честность и внимание к деталям — в каждом проекте</p></header>
    <div class="clients-columns">
      <section class="clients-column" aria-labelledby="client-logos-heading"><div class="clients-column-heading"><h3 id="client-logos-heading">Наши клиенты</h3><span>10 компаний</span></div>
        <div class="clients-pane clients-logos-pane" data-route-scroll tabindex="0" aria-label="Карточки клиентов — прокрутите для просмотра"><div class="client-logos">${logos.map(([name,file],i)=>`<article class="client-logo client-float-card" aria-label="${name}" style="--card-order:${i}"><img src="assets/clients/${file}" alt="${name}" loading="lazy" decoding="async"></article>`).join('')}</div></div>
      </section>
      <section class="clients-column" aria-labelledby="client-reviews-heading"><div class="clients-column-heading"><h3 id="client-reviews-heading">Отзывы и благодарности</h3><span>06 отзывов</span></div>
        <div class="clients-pane clients-reviews-pane" data-route-scroll tabindex="0" aria-label="Отзывы клиентов — прокрутите для чтения"><div class="client-reviews">${reviews.map(r=>`<article class="client-review client-float-card"><blockquote>${r.text}</blockquote>${r.more?`<details><summary>Читать полностью</summary><p>${r.more}</p></details>`:''}<div class="review-author"><strong>${r.name}</strong><span>${r.role}</span></div></article>`).join('')}</div></div>
      </section>
    </div>
    <div class="clients-end"><span>Прокрутите вне карточек, чтобы продолжить</span></div>
  </div></div>`;
  document.querySelector('#journey .stage').appendChild(scene);
  const stackedLayout=matchMedia('(max-width:760px)');
  function configureScroll(){
    scene.querySelectorAll('.clients-pane').forEach(area=>{
      area.toggleAttribute('data-route-scroll',!stackedLayout.matches);
      area.tabIndex=stackedLayout.matches?-1:0;
    });
  }
  configureScroll();stackedLayout.addEventListener('change',configureScroll);
  let lastActive=false;
  window.GooddoClients={render(opacity){const active=opacity>.01;scene.style.opacity=String(opacity);scene.style.visibility=active?'visible':'hidden';scene.style.pointerEvents=opacity>.95?'auto':'none';scene.inert=opacity<=.95;scene.setAttribute('aria-hidden',String(!active));if(active&&!lastActive)scene.querySelectorAll('[data-route-scroll]').forEach(area=>area.scrollTop=0);lastActive=active;}};
  // Only the card under the pointer moves; no automatic or repeating animation.
  const pointerMotion=matchMedia('(hover:hover) and (pointer:fine)');
  const reducedMotion=matchMedia('(prefers-reduced-motion:reduce)');
  scene.querySelectorAll('.client-float-card').forEach(card=>{
    let frame=0;
    const reset=()=>{cancelAnimationFrame(frame);frame=0;card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y');card.style.removeProperty('--glint-x');card.style.removeProperty('--glint-y')};
    card.addEventListener('pointermove',event=>{
      if(!pointerMotion.matches||reducedMotion.matches)return;
      const rect=card.getBoundingClientRect();
      const x=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));
      const y=Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));
      cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
        card.style.setProperty('--tilt-x',((.5-y)*5).toFixed(2)+'deg');
        card.style.setProperty('--tilt-y',((x-.5)*7).toFixed(2)+'deg');
        card.style.setProperty('--glint-x',(x*100).toFixed(1)+'%');
        card.style.setProperty('--glint-y',(y*100).toFixed(1)+'%');frame=0;
      });
    });
    card.addEventListener('pointerleave',reset);card.addEventListener('pointercancel',reset);
    reducedMotion.addEventListener('change',reset);
  });
})();
