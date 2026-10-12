(() => {
  let works = window.GOODDO_CASES.ai, activeHall = window.GOODDO_HALLS[0];
  const demo = document.getElementById('demo');
  const deck = document.getElementById('deck');
  const cards = document.getElementById('project-cards');
  const count = document.getElementById('carousel-count');
  const dialog = document.getElementById('project');
  const media = document.getElementById('project-media');
  const video = document.getElementById('project-video');
  const close = document.getElementById('close');
  const status = document.getElementById('status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = 0, centered = 0, closing = false;
  let dragStart = null, dragged = false, lastWheelAt = 0;
  let flight;

  function showCarousel() {
    [...cards.children].forEach((button, index) => {
      const distance = (index - centered + works.length) % works.length;
      const offset = distance === 0 ? 0 : distance === 1 ? 1 : distance === works.length - 1 ? -1 : 'hidden';
      button.dataset.offset = String(offset);
      button.tabIndex = offset === 'hidden' ? -1 : 0;
      button.setAttribute('aria-hidden',String(offset === 'hidden'));
      button.setAttribute('aria-label', (offset === 0 ? 'Смотреть проект ' : 'Выбрать проект ') + works[index].name);
      button.setAttribute('aria-current', offset === 0 ? 'true' : 'false');
    });
    count.textContent = `${String(centered + 1).padStart(2,'0')} / ${String(works.length).padStart(2,'0')}`;
  }

  function rotate(direction, focus = false) {
    if (dialog.open || deck.inert) return;
    centered = (centered + direction + works.length) % works.length;
    showCarousel();
    if (focus) cards.children[centered].focus({preventScroll:true});
    status.textContent = 'Выбран проект ' + works[centered].name;
  }

  function renderCards() {
  cards.replaceChildren();
  works.forEach((work, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'art';
    button.tabIndex = 0;
    const image = document.createElement('img');
    image.src = 'assets/' + work.image;
    image.alt = '';
    const caption = document.createElement('span');
    caption.className = 'card-caption';
    const index = document.createElement('small');
    index.className = 'card-index';
    index.textContent = `${String(i+1).padStart(2,'0')} / ${activeHall.short.toUpperCase()}`;
    const arrow = document.createElement('span');
    arrow.className = 'card-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    caption.append(index, document.createTextNode(work.name), arrow);
    button.append(image, caption);
    button.onclick = () => {
      if (dragged) { dragged = false; return; }
      if (i !== centered) { centered = i; showCarousel(); return; }
      openProject(i);
    };
    cards.append(button);
  });
  showCarousel();
  }
  renderCards();

  function setProject(index) {
    selected = (index + works.length) % works.length;
    const work = works[selected];
    video.pause();
    document.getElementById('project-title').textContent = work.name;
    document.getElementById('project-desc').textContent = work.task || work.format;
    document.getElementById('project-approach').textContent = work.solution || 'Подробности проекта — на основном сайте GoodDo';
    document.getElementById('project-index').textContent = `${String(selected+1).padStart(2,'0')} / ${activeHall.title}`;
    document.getElementById('project-count').textContent = `${String(selected+1).padStart(2,'0')} / ${String(works.length).padStart(2,'0')}`;
    document.getElementById('project-task-label').textContent = work.task ? 'ЗАДАЧА' : 'ФОРМАТ';
    document.getElementById('project-solution-label').textContent = work.solution ? 'РЕШЕНИЕ' : 'О ПРОЕКТЕ';
    const result = document.getElementById('project-result');
    result.hidden = !work.result;
    document.getElementById('project-result-label').hidden = !work.result;
    result.textContent = work.result || '';
    document.getElementById('project-source').href = work.source;
    [...cards.children].forEach((button,i) => button.classList.toggle('selected',i===selected));
    video.poster = 'assets/' + work.image;
    const poster = document.getElementById('project-poster');
    video.hidden = !work.video;
    poster.hidden = Boolean(work.video);
    document.querySelector('.project-tag').textContent = work.format;
    document.getElementById('project-media-label').textContent = work.brand || activeHall.short.toUpperCase();
    if (work.video) {video.src = window.gooddoVideoSource(video, 'assets/' + work.video);video.load();}
    else {video.removeAttribute('src');video.load();poster.src = 'assets/' + work.image;poster.alt = work.name;}
    const services = document.querySelector('.project-services');
    services.replaceChildren();
    for (const detail of [work.client, work.brand].filter(Boolean)) {
      const line = document.createElement('span');
      line.textContent = detail;
      services.append(line);
    }
    status.textContent = 'Открыт проект ' + work.name;
  }

  function flightTransform(rect) {
    const destination = media.getBoundingClientRect();
    const x = rect.left + rect.width/2 - destination.left - destination.width/2;
    const y = rect.top + rect.height/2 - destination.top - destination.height/2;
    return `translate(${x}px,${y}px) scale(${rect.width/destination.width},${rect.height/destination.height})`;
  }

  function openProject(index) {
    if (deck.inert || closing || dialog.open) return;
    const from = cards.children[index].getBoundingClientRect();
    setProject(index);
    dialog.classList.remove('closing');
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    dialog.scrollTop = 0;
    if (!reduced.matches) {
      flight?.cancel();
      flight = media.animate([{transform:flightTransform(from),opacity:.45},{transform:'none',opacity:1}],{duration:650,easing:'cubic-bezier(.2,.8,.2,1)'});
    }
    close.focus({preventScroll:true});
    if (works[selected].video) video.play().catch(() => { status.textContent = 'Нажмите воспроизведение в плеере'; });
  }

  async function closeProject() {
    if (!dialog.open || closing) return;
    closing = true;
    video.pause();
    dialog.classList.add('closing');
    flight?.cancel();
    if (!reduced.matches) {
      flight = media.animate([{transform:'none',opacity:1},{transform:flightTransform(cards.children[selected].getBoundingClientRect()),opacity:0}],{duration:380,easing:'cubic-bezier(.4,0,.7,1)',fill:'forwards'});
      await flight.finished.catch(() => {});
    }
    dialog.close();
  }

  dialog.addEventListener('close', () => {
    video.pause();
    flight?.cancel();
    closing = false;
    dialog.classList.remove('closing');
    document.body.style.overflow = '';
    cards.children[selected].focus({preventScroll:true});
    status.textContent = 'Вы вернулись к работам';
  });
  dialog.addEventListener('cancel', event => {event.preventDefault();closeProject();});
  close.onclick = closeProject;
  document.getElementById('carousel-prev').onclick = () => rotate(-1, true);
  document.getElementById('carousel-next').onclick = () => rotate(1, true);
  cards.addEventListener('wheel', event => {
    if (!event.target.closest('.art') || deck.inert || dialog.open) return;
    event.preventDefault();
    const now = performance.now();
    if (now - lastWheelAt < 420 || Math.abs(event.deltaY) < 3) return;
    lastWheelAt = now;
    rotate(event.deltaY > 0 ? 1 : -1);
  }, {passive:false});
  cards.addEventListener('pointerdown', event => {
    if (!event.target.closest('.art') || deck.inert || dialog.open) return;
    dragStart = {x:event.clientX, y:event.clientY};
    dragged = false;
  });
  window.addEventListener('pointerup', event => {
    if (!dragStart) return;
    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;
    dragStart = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      dragged = true;
      rotate(dx < 0 ? 1 : -1);
      setTimeout(() => { dragged = false; }, 350);
    }
  });
  window.addEventListener('pointercancel', () => { dragStart = null; });
  cards.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    rotate(event.key === 'ArrowRight' ? 1 : -1, true);
  });
  document.getElementById('prev').onclick = () => {if (!closing) {setProject(selected-1);if(works[selected].video) video.play().catch(()=>{});}};
  document.getElementById('next').onclick = () => {if (!closing) {setProject(selected+1);if(works[selected].video) video.play().catch(()=>{});}};
  document.addEventListener('visibilitychange', () => {if(document.hidden) video.pause();});
  window.setPortfolioHall = index => {
    activeHall = window.GOODDO_HALLS[index];
    works = window.GOODDO_CASES[activeHall.id];
    centered = 0;
    cards.setAttribute('aria-label', 'Карусель проектов — '+activeHall.title);
    renderCards();
  };
  window.leavePortfolio = () => { dragStart = null; };
})();
