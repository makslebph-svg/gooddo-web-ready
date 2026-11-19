(() => {
  const privacyUrl='privacy.html';
  const service='77509557f418129d7ea93f406f9432b1';
  const field=(name,type,label,required=false)=>`<div class="t-input-group" data-input-lid="${name}" data-field-type="${type==='email'?'em':type==='tel'?'ph':'nm'}" data-field-name="${name}"><div class="t-input-block"><label><span class="form-field-label">${label}</span><input class="t-input js-tilda-rule" name="${name}" type="${type}" placeholder="${label}" autocomplete="${type==='tel'?'tel':type==='email'?'email':'name'}" ${required?'required data-tilda-req="1"':''} ${type==='email'?'data-tilda-rule="email"':''} ${type==='tel'?'inputmode="tel" minlength="7" maxlength="25"':''}></label><div class="t-input-error"></div></div></div>`;
  function form(id,hasEmail){return `<div class="r t-rec t396 gooddo-form-record" id="rec${id}" data-record-type="396"><form id="form${id}" name="form${id}" class="gooddo-project-form t-form js-form-proccess" method="POST" action="https://forms.tildaapi.com/procces/" data-formactiontype="2" data-inputbox=".t-input-group" data-success-callback="gooddoProjectFormSuccess"><input type="hidden" name="formservices[]" class="js-formaction-services" value="${service}"><input type="hidden" name="tildaspec-elemid" value="1755788534053"><input type="hidden" name="Project" value=""><div class="js-successbox t-form__successbox" role="status" style="display:none">Спасибо за обращение — наш менеджер свяжется с вами в ближайшее время</div><div class="t-form__inputsbox"><div class="gooddo-form-fields">${field('name','text','Имя',true)}${hasEmail?field('email','email','Почта'):''}${field('Phone','tel','Телефон',true)}<div class="t-form__submit"><button type="submit" class="t-submit">${hasEmail?'Оставить заявку ↗':'Перезвоните мне ↗'}</button></div></div><div class="t-input-group consent-group" data-input-lid="consent" data-field-type="cb"><div class="t-input-block"><label class="form-consent"><input type="checkbox" name="consent" value="yes" class="t-checkbox js-tilda-rule" required data-tilda-req="1"><span>Согласен на обработку персональных данных и ознакомился с <a href="${privacyUrl}" target="_blank" rel="noopener">политикой конфиденциальности</a></span></label><div class="t-input-error"></div></div></div><div class="t-form__errorbox-middle"><div class="js-errorbox-all t-form__errorbox-wrapper" style="display:none" role="alert"><ul class="t-form__errorbox-text"><li class="t-form__errorbox-item js-rule-error js-rule-error-all"></li><li class="t-form__errorbox-item js-rule-error js-rule-error-req">Заполните обязательные поля и подтвердите согласие</li><li class="t-form__errorbox-item js-rule-error js-rule-error-email">Проверьте адрес почты</li><li class="t-form__errorbox-item js-rule-error js-rule-error-phone">Проверьте номер телефона</li></ul></div></div><p class="form-local-status" role="status" aria-live="polite"></p></div></form></div>`}
  const meta=document.createElement('div');meta.id='allrecords';meta.hidden=true;Object.entries({'data-tilda-project-id':'9187793','data-tilda-page-id':'74129459','data-tilda-formskey':'16b9d846f5ecf7f5ce102ea559187793','data-tilda-project-lang':'RU','data-tilda-root-zone':'com','data-tilda-project-country':'RU','data-tilda-cookie':'no'}).forEach(([k,v])=>meta.setAttribute(k,v));document.body.appendChild(meta);
  const final=document.querySelector('.final-content');
  if (final) {
    final.classList.add('final-project');
    final.innerHTML = `
      <span class="eyebrow">GOODDO / ДАВАЙТЕ СОЗДАВАТЬ ВМЕСТЕ</span>
      <h2>Будем рады сделать<br> с вами классные проекты</h2>
      ${form('1234959346',true)}
      <div class="final-project-bottom">
        <div class="work-geography">
          <h3>Где мы работаем</h3>
          <ol>
            <li>Базируемся в Москве</li>
            <li>Выезжаем в другие города</li>
            <li>Формируем локальные съёмочные команды под проект</li>
          </ol>
        </div>
        <address class="project-contacts">
          <a href="mailto:gooddoprod@gmail.com"><span>Почта</span>gooddoprod@gmail.com</a>
          <a href="tel:+79254082554"><span>Телефон</span>+7 (925) 408-25-54</a>
          <a href="https://t.me/ramil_arifullov" target="_blank" rel="noopener"><span>Telegram</span>ramil_arifullov ↗</a>
        </address>
      </div>`;
  }
  const modal=document.createElement('dialog');modal.id='estimate-dialog';modal.className='estimate-dialog';modal.setAttribute('aria-labelledby','estimate-heading');modal.innerHTML=`<button type="button" class="estimate-close" aria-label="Закрыть форму">×</button><span class="eyebrow">GOODDO / РАССЧИТАТЬ ПРОЕКТ</span><h2 id="estimate-heading">Позвоним вам, уточним детали и рассчитаем стоимость проекта</h2>${form('1579755771',false)}`;document.body.appendChild(modal);
  let lastTrigger=null,libraryReady=false;
  window.openGooddoEstimate = (project = '', trigger) => {
    if (typeof stopFlight === 'function') stopFlight();
    lastTrigger = trigger || document.activeElement;
    const estimateForm = modal.querySelector('.gooddo-project-form');
    const inputs = estimateForm.querySelector('.t-form__inputsbox');
    if (inputs.hidden) {
      const success = estimateForm.querySelector('.js-successbox');
      estimateForm.reset();
      estimateForm.classList.remove('js-send-form-success');
      success.style.display = 'none';
      inputs.hidden = false;
    }
    modal.querySelector('[name="Project"]').value = project;
    document.querySelectorAll('video').forEach(video => {
      if (!video.muted) video.pause();
    });
    modal.showModal();
    modal.querySelector('[name="name"]').focus({ preventScroll: true });
  };
  modal.querySelector('.estimate-close').addEventListener('click',()=>modal.close());modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close()}});modal.addEventListener('close',()=>lastTrigger?.focus({preventScroll:true}));
  document.addEventListener('click',e=>{const trigger=e.target.closest('#project-source,.route-contact,[data-estimate]');if(!trigger)return;e.preventDefault();window.openGooddoEstimate(trigger.id==='project-source'?(trigger.dataset.project||document.getElementById('project-title')?.textContent||''):'',trigger)});
  function setFormStatus(form, message, kind = '') {
    const status = form.querySelector('.form-local-status');
    status.textContent = message;
    status.dataset.state = kind;
  }

  function invalidMessage(field) {
    if (field.name === 'name' && field.validity.valueMissing) return 'Укажите ваше имя';
    if (field.name === 'Phone') return 'Укажите номер телефона с кодом страны';
    if (field.name === 'email') return 'Проверьте адрес почты';
    if (field.name === 'consent') return 'Подтвердите согласие на обработку персональных данных';
    return field.validationMessage;
  }

  document.querySelectorAll('.gooddo-project-form').forEach(form => {
    const phone = form.querySelector('[name="Phone"]');
    const consent = form.querySelector('.consent-group');
    const submit = form.querySelector('.t-form__submit');
    consent.after(submit);

    const fields = [...form.querySelectorAll('.t-input, .t-checkbox')];
    const fieldErrors = new Map();
    fields.forEach(field => {
      if (field.classList.contains('t-input')) field.removeAttribute('placeholder');
      const error = field.closest('.t-input-group').querySelector('.t-input-error');
      error.id = `${form.id}-${field.name}-error`;
      const localError = document.createElement('span');
      localError.className = 'form-field-error';
      localError.id = `${error.id}-local`;
      error.before(localError);
      fieldErrors.set(field, localError);
      field.setAttribute('aria-describedby', `${localError.id} ${error.id}`);
    });

    form.addEventListener('invalid', event => {
      const field = event.target;
      const message = invalidMessage(field);
      field.setAttribute('aria-invalid', 'true');
      fieldErrors.get(field).textContent = message;
      if (field === form.querySelector('input:invalid')) {
        setFormStatus(form, message, 'error');
      }
    }, true);

    form.addEventListener('input', event => {
      const field = event.target;
      if (!fieldErrors.has(field)) return;
      if (field === phone) phone.setCustomValidity('');
      field.removeAttribute('aria-invalid');
      fieldErrors.get(field).textContent = '';
      setFormStatus(form, '');
    });

    const validateSubmission = event => {
      const digits = phone.value.replace(/\D/g, '');
      phone.setCustomValidity(digits.length >= 7 && digits.length <= 15 ? '' : 'Укажите номер телефона с кодом страны');
      const valid = form.reportValidity();
      if (!valid || !libraryReady) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (valid) {
          setFormStatus(form, 'Сервис заявок недоступен. Обновите страницу или позвоните по номеру +7 (925) 408-25-54', 'error');
        }
        return;
      }
      setFormStatus(form, '');
    };
    // Tilda handles button clicks on the record before the browser emits submit.
    submit.addEventListener('click', validateSubmission, true);
    form.addEventListener('submit', validateSubmission, true);

    form.addEventListener('tildaform:aftererror', () => {
      setFormStatus(form, 'Заявка не отправлена. Проверьте поля или повторите позже', 'error');
    });
  });

  window.gooddoProjectFormSuccess = formNode => {
    const form = formNode?.jquery ? formNode[0] : formNode;
    if (!form?.matches?.('.gooddo-project-form')) return;
    const success = form.querySelector('.js-successbox');
    setFormStatus(form, '');
    form.querySelector('.t-form__inputsbox').hidden = true;
    success.textContent = 'Заявка отправлена. Свяжемся с вами в ближайшее время';
    success.style.display = 'block';
    success.tabIndex = -1;
    success.focus({preventScroll:true});
  };
  function script(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
  // The public configuration is copied from gooddo.ru. Official Tilda code preserves its receiver and CAPTCHA protocol.
  script('https://static.tildacdn.com/js/tilda-scripts-3.0.min.js').then(()=>script('https://static.tildacdn.com/js/tilda-forms-1.0.min.js')).then(()=>{window.t_forms__initForms();
    const showCaptcha=window.tildaForm.addTildaCaptcha;
    window.tildaForm.addTildaCaptcha=(form,key)=>{
      showCaptcha(form,key);
      const box=document.getElementById('tildaformcaptchabox');
      if(!box)return;
      let layer=document.getElementById('gooddo-captcha-dialog');
      if(!layer){layer=document.createElement('dialog');layer.id='gooddo-captcha-dialog';layer.setAttribute('aria-label','Подтверждение отправки заявки');document.body.appendChild(layer);layer.addEventListener('cancel',()=>{layer.querySelector('#tildaformcaptchabox')?.remove()})}
      box.style.position='absolute';layer.appendChild(box);if(!layer.open)layer.showModal();
      const observer=new MutationObserver(()=>{if(!layer.contains(box)){layer.close();observer.disconnect()}});observer.observe(layer,{childList:true});
    };
    libraryReady=true;document.documentElement.dataset.formsReady='true'}).catch(()=>{document.documentElement.dataset.formsReady='error'});
})();

