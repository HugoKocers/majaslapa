/* === Helpers === */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

/* === Inline fallback for header/footer === */
const HEADER_HTML = `
<header class="site-header">
  <a class="logo" href="index.html">Pelmeņi</a>
  <nav class="header-right" id="mainNav">
    <a class="nav-link" href="index.html">Home</a>
    <div class="dropdown">
      <button class="dropbtn">Services ▾</button>
      <div class="dropdown-content">
        <a href="index.html#products">Products</a>
        <a href="flipper.html">Card Flipper</a>
        <a href="contact.html">Contact</a>
      </div>
    </div>
    <a class="nav-link" href="flipper.html">Card Flipper</a>
    <a class="nav-link" href="contact.html">Contact</a>
  </nav>
  <div class="header-actions">
    <button id="themeToggle" class="theme-toggle" title="Toggle dark / light">🌓</button>
    <button id="hamburger" class="hamburger" aria-label="Open menu">☰</button>
  </div>
</header>`;
const FOOTER_HTML = `
<footer class="site-footer">
  <div class="footer-inner">
    <h4>Pelmeņi</h4>
    <p class="footer-copy">© 2025 Pelmeņi — All rights reserved</p>
  </div>
</footer>`;

/* === Load header/footer === */
async function loadComponent(url, slotId, fallback) {
  try {
    const res = await fetch(url, {cache:'no-store'});
    if (!res.ok) throw new Error();
    document.getElementById(slotId).innerHTML = await res.text();
  } catch {
    document.getElementById(slotId).innerHTML = fallback;
  }
}

(async function boot(){
  await loadComponent('components/header.html','header-slot',HEADER_HTML);
  await loadComponent('components/footer.html','footer-slot',FOOTER_HTML);
  initSharedUI();
  initIndexPage();
  initContactPage();
})();

/* === Shared UI === */
function initSharedUI(){
  // saved theme
  if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');

  const themeToggle = $('#themeToggle');
  const hologram = $('.holographic-card');

  const toggleTheme = () => {
    const light = document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', light ? 'light' : 'dark');
    if (themeToggle) themeToggle.style.color = light ? '#000' : '#00f0ff';
    if (hologram) hologram.style.transition = 'all .5s ease';
    setTimeout(()=>{ if(hologram) hologram.style.transition=''; },500);
  };

  if (themeToggle) themeToggle.onclick = toggleTheme;
  if (hologram) {
    hologram.onclick = toggleTheme;
    hologram.onkeydown = e => { if(e.key==='Enter'||e.key===' ') toggleTheme(); };
  }

  // hamburger
  const burger = $('#hamburger');
  const nav = $('.header-right');
  if (burger && nav) {
    burger.onclick = ()=>nav.classList.toggle('show');
    document.addEventListener('click',e=>{
      if(!nav.contains(e.target)&&e.target!==burger) nav.classList.remove('show');
    });
  }

  // dropdown
  $$('.dropbtn').forEach(btn=>{
    btn.addEventListener('click',e=>{
      const c=btn.nextElementSibling;
      c.style.display=c.style.display==='block'?'':'block';
      e.stopPropagation();
    });
  });
  document.addEventListener('click',()=>$$('.dropdown-content').forEach(c=>c.style.display=''));
}

/* === INDEX PAGE: cards CRUD + search + modal === */
function initIndexPage(){
  if (!$('#cardContainer')) return;
  const STORAGE='pelmeni_products_v1';
  const randImg=()=>`https://picsum.photos/600/400?random=${Math.floor(Math.random()*10000)}`;
  const newId=()=>`c_${Date.now()}_${Math.floor(Math.random()*1000)}`;
  let cards=[];
  try{ cards=JSON.parse(localStorage.getItem(STORAGE))||[]; }catch{}

  const save=()=>localStorage.setItem(STORAGE,JSON.stringify(cards));
  if(!cards.length){
    cards=[
      {id:newId(),title:'Holographic Lens',desc:'Advanced optics for crisp holograms',image:randImg()},
      {id:newId(),title:'Neon Light Board',desc:'Bright neon signage for displays',image:randImg()},
      {id:newId(),title:'Virtual Display',desc:'Next-gen virtual display technology',image:randImg()}
    ]; save();
  }

  const container=$('#cardContainer'),
        search=$('#searchInput'),
        create=$('#createCardBtn'),
        modal=$('#cardModal'),
        close=$('#cardModalClose'),
        form=$('#cardForm'),
        view=$('#cardModalView'),
        titleInp=$('#cardTitle'),
        descInp=$('#cardDesc'),
        imgInp=$('#cardImage'),
        formTitle=$('#cardFormTitle'),
        vTitle=$('#modalTitle'),
        vDesc=$('#modalDesc'),
        vEdit=$('#modalEditBtn'),
        vDel=$('#modalDeleteBtn');
  let editingId=null,currentId=null;

  const render=(filter='')=>{
    const q=filter.toLowerCase();
    container.innerHTML='';
    cards.forEach(c=>{
      if(q && !(c.title+c.desc).toLowerCase().includes(q)) return;
      const el=document.createElement('article');
      el.className='card';
      el.innerHTML=`
        <img src="${c.image||randImg()}" alt="${c.title}">
        <h3>${c.title}</h3><p>${c.desc}</p>
        <div class="card-actions">
          <button class="btn-primary small learn-btn" data-id="${c.id}">Learn More</button>
          <button class="btn-secondary small edit-btn" data-id="${c.id}">Edit</button>
          <button class="btn-danger small delete-btn" data-id="${c.id}">Delete</button>
        </div>`;
      container.appendChild(el);
    });
    hook();
  };

  function hook(){
    $$('.learn-btn').forEach(b=>b.onclick=viewCard);
    $$('.edit-btn').forEach(b=>b.onclick=startEdit);
    $$('.delete-btn').forEach(b=>b.onclick=del);
  }

  function openModal(showForm=false){
    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
    form.style.display=showForm?'block':'none';
    view.style.display=showForm?'none':'block';
  }
  function closeModal(){
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
    form.style.display=view.style.display='none';
  }

  function viewCard(e){
    const c=cards.find(x=>x.id===e.target.dataset.id);
    if(!c)return;
    currentId=c.id;
    vTitle.textContent=c.title;
    vDesc.textContent=c.desc;
    openModal(false);
  }

  function startEdit(e){
    const c=cards.find(x=>x.id===e.target.dataset.id);
    if(!c)return;
    editingId=c.id;
    formTitle.textContent='Edit Card';
    titleInp.value=c.title;
    descInp.value=c.desc;
    imgInp.value=c.image;
    openModal(true);
  }

  function del(e){
    const id=e.target.dataset.id;
    if(confirm('Delete this card?')){
      cards=cards.filter(c=>c.id!==id);
      save(); render(search.value);
    }
  }

  vEdit.onclick=()=>{
    const c=cards.find(x=>x.id===currentId);
    if(!c)return;
    editingId=c.id;
    formTitle.textContent='Edit Card';
    titleInp.value=c.title;descInp.value=c.desc;imgInp.value=c.image;
    openModal(true);
  };
  vDel.onclick=()=>{
    if(confirm('Delete this card?')){
      cards=cards.filter(c=>c.id!==currentId);
      save();render(search.value);closeModal();
    }
  };

  create.onclick=()=>{
    editingId=null;
    formTitle.textContent='Create Card';
    titleInp.value='';descInp.value='';imgInp.value='';
    openModal(true);
  };
  $('#cardFormCancel').onclick=closeModal;
  close.onclick=closeModal;
  modal.onclick=e=>{if(e.target===modal)closeModal()};
  document.onkeydown=e=>{if(e.key==='Escape')closeModal()};

  form.onsubmit=e=>{
    e.preventDefault();
    const t=titleInp.value.trim(),d=descInp.value.trim(),i=imgInp.value.trim()||randImg();
    if(!t||!d)return alert('Please fill out all fields.');
    if(editingId){
      cards=cards.map(c=>c.id===editingId?{...c,title:t,desc:d,image:i}:c);
    }else{
      cards.unshift({id:newId(),title:t,desc:d,image:i});
    }
    save();render(search.value);closeModal();
  };
  search.oninput=e=>render(e.target.value);
  render();
}

/* === CONTACT FORM === */
function initContactPage(){
  const f=$('#contactForm');
  if(!f)return;
  const msg=$('#formMessage');
  f.onsubmit=e=>{
    e.preventDefault();
    const n=$('#cname').value.trim(),m=$('#cmessage').value.trim(),em=$('#cemail').value.trim();
    if(!n||!em||!m){msg.textContent='Please fill all fields.';msg.style.color='red';return;}
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){msg.textContent='Invalid email.';msg.style.color='orange';return;}
    msg.textContent='Form submitted successfully!';msg.style.color='lime';
    f.reset();setTimeout(()=>msg.textContent='',3000);
  };
}
