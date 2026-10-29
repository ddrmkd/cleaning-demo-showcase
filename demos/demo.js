'use strict';
const config=JSON.parse(document.getElementById('demo-config').textContent);
const $=id=>document.getElementById(id);
const node=(tag,cl,text)=>{const e=document.createElement(tag);if(cl)e.className=cl;if(text!==undefined)e.textContent=text;return e;};
const clamp=(v,min=0,max=99)=>{const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,Math.round(n))):min;};
const state={service:config.services[0].id,area:55,quantities:{},sofas:1,condition:$('condition').value,notes:''};
const current=()=>config.services.find(s=>s.id===state.service);
const activeExtras=()=>config.extras.filter(e=>!(config.chemical&&state.service==='sofa'));
const selected=()=>activeExtras().map(e=>({...e,count:state.quantities[e.id]||0})).filter(e=>e.count>0);
function summaryLines(){
 const s=current();
 const lines=['ДЕМО-ЗАЯВКА · FORMACLEAN','Для: '+config.name,'Город: Санкт-Петербург','Услуга: '+s.name];
 if(s.area)lines.push((config.chemical?'Площадь ковролина: ':'Площадь помещения: ')+state.area+' м²');
 if(config.chemical&&s.id==='sofa')lines.push('Количество диванов: '+state.sofas);
 const items=selected();
 if(items.length){lines.push('Дополнительные работы:');items.forEach(e=>lines.push('— '+e.name+': '+e.count+' ('+e.unit+')'));}
 lines.push('Состояние: '+state.condition);
 if(state.notes.trim())lines.push('Пожелания: '+state.notes.trim());
 lines.push('Стоимость: по запросу. Тарифы не подключены.','Неофициальная демонстрация. Заявка не отправлена.');
 return lines;
}
function renderSummary(){
 const s=current(),items=selected(),el=$('breakdown');el.replaceChildren();
 function row(a,b){const r=node('div','bill-line');r.append(node('span','',a),node('strong','',b));el.append(r);}
 row('Услуга',s.name);
 if(s.area)row(config.chemical?'Ковролин':'Площадь',state.area+' м²');
 if(config.chemical&&s.id==='sofa')row('Диваны',state.sofas+' шт.');
 items.forEach(e=>row(e.name,e.count+' '+e.unit));
 row('Состояние',state.condition);
 if(state.notes.trim())el.append(node('p','empty-extra-state','Пожелания: '+state.notes.trim()));
 const available=s.area||Boolean(config.chemical&&s.id==='sofa')||items.length;
 $('generate').disabled=!available;
 if(!available)el.append(node('p','empty-extra-state','Укажите количество предметов ниже.'));
 const count=items.reduce((sum,e)=>sum+e.count,0);
 $('selected-counter').textContent=count?'Количество: '+count:'Ничего не выбрано';
 $('reset-extras').disabled=!count;
 $('order-preview').hidden=true;
 $('summary-note').hidden=state.condition==='Обычное состояние';
 fitSummary();
}
function selectService(id){
 state.service=id;
 for(const b of $('services').children)b.setAttribute('aria-pressed',String(b.dataset.id===id));
 $('area-group').hidden=!current().area&&!config.chemical;
 if(config.chemical){$('sofa-count-group').hidden=id!=='sofa';$('carpet-area').hidden=id==='sofa';}
 renderExtras();renderSummary();
}
function renderServices(){
 for(const s of config.services){
  const b=node('button','service');b.type='button';b.dataset.id=s.id;
  b.setAttribute('aria-pressed',String(s.id===state.service));
  const top=node('div','service-top');top.append(node('span','service-symbol',s.symbol),node('span','service-indicator','✓'));
  b.append(top,node('strong','',s.name),node('small','',s.area?'Укажите площадь':'Укажите количество'));
  b.addEventListener('click',()=>selectService(s.id));$('services').append(b);
 }
}
function setCount(e,value){
 const count=clamp(value,0,e.max);state.quantities[e.id]=count;
 const el=$('extra-'+e.id);el.querySelector('input').value=String(count);el.classList.toggle('has-count',count>0);
 el.querySelector('[data-action="decrease"]').disabled=count===0;
 el.querySelector('[data-action="increase"]').disabled=count===e.max;renderSummary();
}
function renderExtras(){
 const extras=activeExtras();$('extras-group').hidden=!extras.length;$('extra-filters').hidden=true;
 $('extras').replaceChildren();
 for(const e of extras){
  const card=node('div','extra');card.id='extra-'+e.id;
  const head=node('div','extra-header'),title=node('div','extra-name');title.append(node('strong','',e.name),node('small','',e.id==='windows'?'Укажите количество створок':'Укажите количество предметов'));
  head.append(node('span','extra-symbol',e.symbol),title);
  const bottom=node('div','extra-bottom'),unit=node('div','extra-price');unit.append(node('strong','','Количество'),node('span','',e.unit));
  const stepper=node('div','qty-stepper'),minus=node('button','','−'),plus=node('button','','+'),input=node('input');
  minus.type=plus.type='button';minus.dataset.action='decrease';plus.dataset.action='increase';
  minus.setAttribute('aria-label','Уменьшить: '+e.name);plus.setAttribute('aria-label','Увеличить: '+e.name);
  input.type='number';input.min='0';input.max=String(e.max);input.step='1';input.inputMode='numeric';input.setAttribute('aria-label','Количество: '+e.name);
  minus.addEventListener('click',()=>setCount(e,(state.quantities[e.id]||0)-1));plus.addEventListener('click',()=>setCount(e,(state.quantities[e.id]||0)+1));
  input.addEventListener('change',()=>setCount(e,input.value));input.addEventListener('blur',()=>setCount(e,input.value));
  stepper.append(minus,input,plus);bottom.append(unit,stepper);card.append(head,bottom);$('extras').append(card);setCount(e,state.quantities[e.id]||0);
 }
 const conditionStep=$('condition').closest('.form-group').querySelector('.step');conditionStep.textContent=extras.length?'04':'03';
}
function setArea(raw){state.area=clamp(raw,15,500);$('area').value=String(state.area);$('range').value=String(state.area);renderSummary();}
$('area').addEventListener('input',e=>{const n=e.target.valueAsNumber;if(Number.isInteger(n)&&n>=15&&n<=500){state.area=n;$('range').value=String(n);renderSummary();}});
$('area').addEventListener('change',e=>setArea(e.target.value));$('area').addEventListener('blur',e=>setArea(e.target.value));
$('range').addEventListener('input',e=>setArea(e.target.value));
$('condition').addEventListener('change',e=>{state.condition=e.target.value;renderSummary();});
$('notes').addEventListener('input',e=>{state.notes=e.target.value;renderSummary();});
if(config.chemical)$('sofa-count').addEventListener('change',e=>{state.sofas=clamp(e.target.value,1,30);e.target.value=String(state.sofas);renderSummary();});
$('reset-extras').addEventListener('click',()=>{state.quantities={};renderExtras();renderSummary();});
$('generate').addEventListener('click',()=>{
 setArea($('area').value);
 if(config.chemical){state.sofas=clamp($('sofa-count').value,1,30);$('sofa-count').value=String(state.sofas);}
 for(const e of activeExtras()){const field=$('extra-'+e.id).querySelector('input');state.quantities[e.id]=clamp(field.value,0,e.max);}
 if($('generate').disabled)return;
 $('preview-text').textContent=summaryLines().join('\n');$('order-preview').hidden=false;$('copy-status').textContent='';
 $('order-preview').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});$('order-preview').focus({preventScroll:true});
});
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('preview-text').textContent);$('copy-status').textContent='Скопировано.';}catch{$('copy-status').textContent='Выделите и скопируйте текст из блока выше.';}});
function fitSummary(){const el=document.querySelector('.order-summary');el.classList.toggle('is-sticky',innerWidth>750&&el.getBoundingClientRect().height<=innerHeight-40);}
window.addEventListener('resize',fitSummary);new ResizeObserver(fitSummary).observe(document.querySelector('.order-summary'));
$('breakdown').setAttribute('aria-live','polite');
renderServices();selectService(state.service);fitSummary();
