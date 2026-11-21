(() => {
  let activeHall = window.GOODDO_HALLS[0];
  let works = window.GOODDO_CASES[activeHall.collection];
  const demo = document.getElementById('demo');
  const deck = document.getElementById('deck');
  const cards = document.getElementById('project-cards');
  const count = document.getElementById('carousel-count');
  const progress = document.getElementById('carousel-progress');
  const dialog = document.getElementById('project');
  const media = document.getElementById('project-media');
  const player = document.getElementById('case-player');
  const video = document.getElementById('project-video');
  const playerStatus = document.getElementById('case-player-status');
  const close = document.getElementById('close');
  const status = document.getElementById('status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = 0, centered = 0, closing = false;
  let dragStart = null, suppressClickUntil = 0, lastWheelAt = 0;
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
    progress.style.transform = `scaleX(${(centered + 1) / works.length})`;
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
    const artwork = artworkFor(work);
    const image = artwork.poster ? document.createElement('img') : document.createElement('span');
    if (artwork.poster) {
      image.src = artwork.poster;
      image.alt = '';
      image.decoding = 'async';
    } else {
      image.className = 'case-card-cover';
      image.setAttribute('aria-hidden', 'true');
    }
    const caption = document.createElement('span');
    caption.className = 'card-caption';
    const index = document.createElement('small');
    index.className = 'card-index';
    index.textContent = work.format;
    const title = document.createElement('span');
    title.className = 'card-title';
    title.textContent = work.name;
    const arrow = document.createElement('span');
    arrow.className = 'card-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.innerHTML = '<svg viewBox="0 0 20 20" focusable="false"><path d="M6 3.5 16 10 6 16.5Z"/></svg>';
    button.title = 'Открыть кейс ' + work.name;
    caption.append(index, title, arrow);
    button.append(image, caption);
    button.onclick = event => {
      if (event.detail && performance.now() < suppressClickUntil) return;
      if (i !== centered) { centered = i; showCarousel(); return; }
      openProject(i);
    };
    cards.append(button);
  });
  showCarousel();
  }
  renderCards();

  function artworkFor(work) {
    return window.GOODDO_CASE_MEDIA[work.id] || {};
  }

  function showVideoLink() {
    player.hidden = true;
    const artwork = artworkFor(works[selected]);
    document.getElementById('project-poster').hidden = !artwork.poster;
    document.getElementById('project-watch').hidden = false;
    media.classList.add('project-media-external');
  }

  video.addEventListener('error', () => {
    if (dialog.open && video.getAttribute('src')) showVideoLink();
  });

  function setProject(index) {
    selected = (index + works.length) % works.length;
    const work = works[selected];
    window.gooddoCasePlayer.stop();
    playerStatus.textContent = '';
    document.getElementById('project-title').textContent = work.name;
    document.getElementById('project-desc').textContent = work.paragraphs[0];
    const story = document.getElementById('project-story');
    story.replaceChildren(...work.paragraphs.slice(1).map(text => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      return paragraph;
    }));
    document.getElementById('project-index').textContent = activeHall.title;
    document.getElementById('project-count').textContent = `${String(selected+1).padStart(2,'0')} / ${String(works.length).padStart(2,'0')}`;
    document.getElementById('project-source').dataset.project = work.name;
    [...cards.children].forEach((button,i) => button.classList.toggle('selected',i===selected));
    const artwork = artworkFor(work);
    const poster = document.getElementById('project-poster');
    const watch = document.getElementById('project-watch');
    player.style.setProperty('--case-ratio', artwork.aspectRatio ?? '');
    watch.href = work.source;
    watch.hidden = true;
    media.classList.remove('project-media-external');
    player.hidden = !artwork.video;
    poster.hidden = true;
    if (artwork.poster) {
      video.poster = artwork.poster;
      poster.src = artwork.poster;
      poster.alt = work.name;
    } else {
      video.removeAttribute('poster');
      poster.removeAttribute('src');
    }
    document.querySelector('.project-tag').textContent = work.format;
    if (artwork.video) {
      video.src = artwork.video;
    } else {
      video.removeAttribute('src');
      showVideoLink();
    }
    video.load();
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
    if (artworkFor(works[selected]).video) {
      video.play().catch(() => {
        if (dialog.open && !closing && !player.hidden && video.paused) playerStatus.textContent = 'Нажмите воспроизведение в плеере';
      });
    }
  }

  async function closeProject() {
    if (!dialog.open || closing) return;
    closing = true;
    dialog.classList.add('closing');
    window.gooddoCasePlayer.stop();
    flight?.cancel();
    if (!reduced.matches) {
      flight = media.animate([{transform:'none',opacity:1},{transform:flightTransform(cards.children[selected].getBoundingClientRect()),opacity:0}],{duration:380,easing:'cubic-bezier(.4,0,.7,1)',fill:'forwards'});
      await flight.finished.catch(() => {});
    }
    dialog.close();
  }

  dialog.addEventListener('close', () => {
    window.gooddoCasePlayer.stop();
    flight?.cancel();
    closing = false;
    dialog.classList.remove('closing');
    document.body.style.overflow = '';
    centered = selected;
    showCarousel();
    cards.children[selected].focus({preventScroll:true});
    status.textContent = 'Вы вернулись к работам';
  });
  dialog.addEventListener('cancel', event => {event.preventDefault();closeProject();});
  close.onclick = closeProject;
  document.getElementById('carousel-prev').onclick = () => rotate(-1);
  document.getElementById('carousel-next').onclick = () => rotate(1);
  cards.addEventListener('wheel', event => {
    if (!event.target.closest('.art') || deck.inert || dialog.open) return;
    // Vertical wheel gestures advance the gallery; horizontal input selects a case.
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 3) return;
    event.preventDefault();
    const now = performance.now();
    if (now - lastWheelAt < 420) return;
    lastWheelAt = now;
    rotate(event.deltaX > 0 ? 1 : -1);
  }, {passive:false});
  function finishCaseGesture(direction) {
    suppressClickUntil = performance.now() + 400;
    if (direction) rotate(direction);
  }

  // The route's touch handler owns finger gestures so a vertical swipe can change halls.
  window.finishCaseGesture = finishCaseGesture;
  cards.addEventListener('touchstart', () => { suppressClickUntil = 0; }, {passive:true});
  cards.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' || event.button !== 0 || !event.target.closest('.art') || deck.inert || dialog.open) return;
    suppressClickUntil = 0;
    dragStart = {id:event.pointerId, x:event.clientX, y:event.clientY};
  });
  window.addEventListener('pointerup', event => {
    if (event.pointerId !== dragStart?.id) return;
    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;
    dragStart = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      finishCaseGesture(dx < 0 ? 1 : -1);
    }
  });
  window.addEventListener('pointercancel', event => {
    if (event.pointerId === dragStart?.id) dragStart = null;
  });
  cards.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    rotate(event.key === 'ArrowRight' ? 1 : -1, true);
  });
  function switchProject(direction) {
    if (closing) return;
    setProject(selected + direction);
    dialog.scrollTop = 0;
    if (artworkFor(works[selected]).video) video.play().catch(() => {});
  }
  document.getElementById('prev').onclick = () => switchProject(-1);
  document.getElementById('next').onclick = () => switchProject(1);
  window.setPortfolioHall = index => {
    activeHall = window.GOODDO_HALLS[index];
    works = window.GOODDO_CASES[activeHall.collection];
    centered = 0;
    cards.setAttribute('aria-label', 'Карусель проектов — '+activeHall.title);
    renderCards();
  };
  window.leavePortfolio = () => { dragStart = null; };
})();
