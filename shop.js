(function(){
const ORDER_EMAIL='novmir.kurbanov@gmail.com';
const eur=n=>'€ '+n.toFixed(2).replace('.',',');
let lang=localStorage.getItem('ht_lang')||'de';
const T={
de:{empty:'Ihr Warenkorb ist leer.',emptyHint:'Entdecken Sie unsere Produkte.',free:'Kostenlos',added:'✓ Hinzugefügt',sending:'Wird gesendet…',placeCard:'Bestellung aufgeben · ',placeBank:'Bestellung bestätigen · ',errCard:'Bitte füllen Sie alle Kartenfelder korrekt aus.',errSend:'Bestellung konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder schreiben Sie an ',doneCard:'Ihre Bestellung ist eingegangen und wurde an unser Büro gesendet. Eine Bestätigung folgt per E-Mail.',doneBank:'Ihre Bestellung ist eingegangen. Bitte überweisen Sie den Betrag mit Ihrer Bestellnummer als Verwendungszweck — wir versenden, sobald die Zahlung eingeht.'},
en:{empty:'Your cart is empty.',emptyHint:'Discover our products.',free:'Free',added:'✓ Added',sending:'Sending…',placeCard:'Place order · ',placeBank:'Confirm order · ',errCard:'Please fill in all card fields correctly.',errSend:'Order could not be sent. Please try again or write to ',doneCard:'Your order has been received and sent to our office. A confirmation will follow by e-mail.',doneBank:'Your order has been received. Please transfer the amount using your order number as reference — we ship as soon as payment arrives.'}};
const L=k=>(T[lang]||T.en)[k];
/* --- auth + per-user cart --- */
const SB_URL='https://bldsaomuxhrujtxxpvha.supabase.co';
const SB_KEY='sb_publishable_0kyqFlGKvps5jIZ6Nj8cLQ_TWGerf7k';
let sb=null,currentUser=null,authReady=false;
let cartKey='ht_cart';
function readCart(){try{return JSON.parse(localStorage.getItem(cartKey)||'{}')}catch(e){return {}}}
let cart=readCart();
function requireLogin(){
  if(!authReady)return false;/* wait for session before allowing */
  if(currentUser)return true;
  window.location.href='account.html';return false;
}
async function initAuth(){
  try{
    const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2');
    sb=createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'ht-auth'}});
    const {data}=await sb.auth.getSession();
    currentUser=data.session?data.session.user:null;
    sb.auth.onAuthStateChange((_e,session)=>{currentUser=session?session.user:null;switchCart()});
  }catch(e){currentUser=null}
  authReady=true;switchCart();
}
function switchCart(){
  cartKey=currentUser?('ht_cart_'+currentUser.id):'ht_cart';
  cart=readCart();
  Object.keys(cart).forEach(id=>{if(!P[id])delete cart[id]});
  renderCart();
}
initAuth();
let payMethod='card';
let currentOrderNo='';
const P={};
document.querySelectorAll('[data-add]').forEach(b=>{
  P[b.dataset.add]={id:b.dataset.add,name:b.dataset.name,nameEn:b.dataset.nameEn||b.dataset.name,price:+b.dataset.price,img:b.dataset.img};
  b.addEventListener('click',()=>{add(b.dataset.add);const s=b.querySelector('span'),de=s.dataset.de,en=s.dataset.en;s.textContent=L('added');setTimeout(()=>{s.dataset.de=de;s.dataset.en=en;s.textContent=lang==='de'?de:en},1200)});
});
Object.keys(cart).forEach(id=>{if(!P[id])delete cart[id]});
try{localStorage.setItem('ht_catalog',JSON.stringify(P))}catch(e){}
const save=()=>localStorage.setItem(cartKey,JSON.stringify(cart));
const count=()=>Object.values(cart).reduce((a,b)=>a+b,0);
const subtotal=()=>Object.entries(cart).reduce((a,[id,q])=>a+P[id].price*q,0);
const shipCost=()=>subtotal()>=60||subtotal()===0?0:6.9;
const grand=()=>subtotal()+shipCost();
function add(id){cart[id]=(cart[id]||0)+1;save();renderCart();openDrawer()}
/* drawer */
const drawer=document.getElementById('drawer'),overlay=document.getElementById('overlay');
function openDrawer(){drawer.classList.add('open');overlay.classList.add('show');document.body.style.overflow='hidden'}
function closeDrawer(){drawer.classList.remove('open');overlay.classList.remove('show');document.body.style.overflow=''}
document.querySelectorAll('.cart-btn').forEach(b=>b.addEventListener('click',openDrawer));
document.getElementById('drClose').onclick=closeDrawer;
overlay.onclick=()=>{closeDrawer();closeCheckout()};
function renderCart(){
  const items=Object.entries(cart),n=count();
  document.querySelectorAll('.cart-count').forEach(el=>{el.textContent=n;el.style.display=n?'flex':'none'});
  const box=document.getElementById('drItems');
  if(!items.length){box.innerHTML='<div class="dr-empty"><p class="serif" style="font-size:24px;margin-bottom:6px">'+L('empty')+'</p><p style="font-size:14px;color:var(--espresso-soft)">'+L('emptyHint')+'</p></div>'}
  else{box.innerHTML=items.map(([id,q])=>{const p=P[id],nm=lang==='de'?p.name:p.nameEn;
    return '<div class="dr-item"><img src="'+p.img+'" alt="'+nm+'"><div class="dr-info"><div class="dr-name serif">'+nm+'</div><div class="dr-unit">'+eur(p.price)+'</div><div class="dr-qty"><button data-dec="'+id+'" aria-label="−">−</button><span>'+q+'</span><button data-inc="'+id+'" aria-label="+">+</button><button class="dr-rm" data-rm="'+id+'" aria-label="Entfernen">×</button></div></div><div class="dr-line serif">'+eur(p.price*q)+'</div></div>'}).join('');
    box.querySelectorAll('[data-inc]').forEach(b=>b.onclick=()=>{cart[b.dataset.inc]++;save();renderCart()});
    box.querySelectorAll('[data-dec]').forEach(b=>b.onclick=()=>{const id=b.dataset.dec;cart[id]--;if(cart[id]<1)delete cart[id];save();renderCart()});
    box.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{delete cart[b.dataset.rm];save();renderCart()});
  }
  const sh=shipCost();
  document.getElementById('sumSub').textContent=eur(subtotal());
  document.getElementById('sumShip').textContent=sh?eur(sh):L('free');
  document.getElementById('sumTotal').textContent=eur(grand());
  document.getElementById('toCheckout').disabled=!items.length;
  document.querySelectorAll('.pay-amt').forEach(e=>e.textContent=eur(grand()));
  document.getElementById('bankAmt').textContent=eur(grand());
}
/* checkout */
const checkout=document.getElementById('checkout');
function showStep(n){checkout.querySelectorAll('.chk-step').forEach((s,i)=>s.classList.toggle('on',i===n-1));checkout.querySelectorAll('.chk-steps b').forEach((b,i)=>b.classList.toggle('on',i<=n-1))}
function openCheckout(){closeDrawer();checkout.classList.add('open');overlay.classList.add('show');document.body.style.overflow='hidden';showStep(1)}
function closeCheckout(){checkout.classList.remove('open');overlay.classList.remove('show');document.body.style.overflow=''}
document.getElementById('toCheckout').onclick=()=>{window.location.href='checkout.html'};
document.getElementById('chkClose').onclick=closeCheckout;
let shipData={};
document.getElementById('shipForm').addEventListener('submit',e=>{
  e.preventDefault();
  shipData={};new FormData(e.target).forEach((v,k)=>shipData[k]=v);
  currentOrderNo='HT-'+String(Date.now()).slice(-6);
  document.getElementById('bankRef').textContent=currentOrderNo;
  showStep(2);
});
/* payment method tabs */
document.querySelectorAll('.paytab').forEach(t=>t.addEventListener('click',()=>{
  payMethod=t.dataset.method;
  document.querySelectorAll('.paytab').forEach(x=>x.classList.toggle('on',x===t));
  document.getElementById('pmCard').classList.toggle('on',payMethod==='card');
  document.getElementById('pmBank').classList.toggle('on',payMethod==='bank');
  document.getElementById('payLabel').textContent=payMethod==='bank'?L('placeBank'):L('placeCard');
}));
/* card formatting */
const cardNum=document.getElementById('cardNum'),cardExp=document.getElementById('cardExp'),cardCvc=document.getElementById('cardCvc');
cardNum.addEventListener('input',()=>{cardNum.value=cardNum.value.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim()});
cardExp.addEventListener('input',()=>{let v=cardExp.value.replace(/\D/g,'').slice(0,4);cardExp.value=v.length>2?v.slice(0,2)+'/'+v.slice(2):v});
cardCvc.addEventListener('input',()=>{cardCvc.value=cardCvc.value.replace(/\D/g,'').slice(0,4)});
/* submit order */
const payErr=document.getElementById('payErr');
document.getElementById('payForm').addEventListener('submit',async e=>{
  e.preventDefault();
  payErr.style.display='none';
  if(!document.getElementById('agbOk').checked||!document.getElementById('dsOk').checked){
    payErr.textContent=lang==='de'?'Bitte akzeptieren Sie die AGB und die Datenschutzerklärung.':'Please accept the Terms and the Privacy Policy.';
    payErr.style.display='block';return;
  }
  if(payMethod==='card'){
    const num=cardNum.value.replace(/\s/g,'');
    if(!document.getElementById('cardName').value.trim()||num.length<15||cardExp.value.length<5||cardCvc.value.length<3){
      payErr.textContent=L('errCard');payErr.style.display='block';return;
    }
  }
  const btn=document.getElementById('payBtn'),sp=btn.querySelector('span:first-child'),saved=sp.textContent;
  btn.disabled=true;sp.textContent=L('sending');
  const lines=Object.entries(cart).map(([id,q])=>{const p=P[id];return q+' × '+p.name+' — '+eur(p.price*q)}).join('\n');
  const payload={
    _subject:'Neue Bestellung '+currentOrderNo+' — Habsburger Torte',
    Bestellnummer:currentOrderNo,
    Zahlungsart:payMethod==='bank'?'SEPA-Überweisung':'Kreditkarte',
    Name:(shipData.Vorname||'')+' '+(shipData.Nachname||''),
    EMail:shipData.EMail||'',
    Telefon:shipData.Telefon||'',
    Adresse:(shipData.Strasse||'')+', '+(shipData.PLZ||'')+' '+(shipData.Stadt||'')+', '+(shipData.Land||''),
    Bestellung:lines,
    Zwischensumme:eur(subtotal()),
    Versand:shipCost()?eur(shipCost()):'Kostenlos',
    Gesamt:eur(grand())
  };
  let ok=false;
  try{
    const r=await fetch('https://formsubmit.co/ajax/'+ORDER_EMAIL,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});
    ok=r.ok;
  }catch(err){ok=false}
  if(!ok){
    // Fallback: open the customer's mail client pre-filled to our office
    const body=Object.entries(payload).filter(([k])=>k[0]!=='_').map(([k,v])=>k+': '+v).join('\n');
    window.location.href='mailto:'+ORDER_EMAIL+'?subject='+encodeURIComponent(payload._subject)+'&body='+encodeURIComponent(body);
  }
  document.getElementById('orderNo').textContent=currentOrderNo;
  document.getElementById('doneMsg').textContent=payMethod==='bank'?L('doneBank'):L('doneCard');
  showStep(3);
  cart={};save();renderCart();
  btn.disabled=false;sp.textContent=saved;
});
document.getElementById('chkDone').onclick=closeCheckout;
/* language */
/* de = source text in the markup; every other locale reads data-<code> and falls back to data-en */
const LANGS=[{code:'de',label:'Deutsch',short:'DE'},{code:'en',label:'English',short:'EN'},{code:'zh',label:'中文',short:'中文'},{code:'ru',label:'Русский',short:'RU'},{code:'ar',label:'العربية',short:'AR'}];
const langWraps=[...document.querySelectorAll('.lang-wrap')];
const langBtns=[...document.querySelectorAll('.lang-btn')];
const langOpts=[...document.querySelectorAll('.lang-menu button')];
const dict=()=>(window.HT_I18N&&window.HT_I18N[lang])||null;
const nodeText=el=>{
  if(lang==='de')return el.dataset.de;
  const d=dict(),k=el.dataset.i;
  if(d&&k&&d[k]!=null)return d[k];
  return el.dataset[lang]||el.dataset.en;
};
function refreshLangNodes(){
  document.querySelectorAll('[data-en]').forEach(el=>{if(el.dataset.de===undefined)el.dataset.de=el.innerHTML;el.innerHTML=nodeText(el)});
  document.querySelectorAll('[data-en-ph]').forEach(el=>{if(el.dataset.dePh===undefined)el.dataset.dePh=el.getAttribute('placeholder')||'';el.setAttribute('placeholder',lang==='de'?el.dataset.dePh:(el.dataset[lang+'Ph']||el.dataset.enPh))});
  const pl=document.getElementById('payLabel');if(pl)pl.textContent=payMethod==='bank'?L('placeBank'):L('placeCard');
}
function closeLangMenus(){langWraps.forEach(w=>{w.classList.remove('open');const b=w.querySelector('.lang-btn');if(b)b.setAttribute('aria-expanded','false')})}
function setLang(l){
  if(!LANGS.some(x=>x.code===l))l='de';
  lang=l;localStorage.setItem('ht_lang',l);document.documentElement.lang=l;
  document.documentElement.dir=(l==='ar')?'rtl':'ltr';
  refreshLangNodes();
  const short=(LANGS.find(x=>x.code===l)||LANGS[0]).short;
  langBtns.forEach(b=>b.textContent=short);
  langOpts.forEach(b=>b.setAttribute('aria-selected',b.dataset.lang===l?'true':'false'));
  renderCart();
}
langBtns.forEach(b=>b.addEventListener('click',e=>{
  e.stopPropagation();
  const w=b.closest('.lang-wrap');
  if(!w){setLang(lang==='de'?'en':'de');return}
  const open=w.classList.contains('open');closeLangMenus();
  if(!open){w.classList.add('open');b.setAttribute('aria-expanded','true')}
}));
langOpts.forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();setLang(b.dataset.lang);closeLangMenus()}));
document.addEventListener('click',closeLangMenus);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLangMenus()});
setLang(lang);
window.HT={setLang};
})();
