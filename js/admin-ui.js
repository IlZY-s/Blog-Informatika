// Admin UI: view switching and basic actions
(function(){
  if(!window.auth) { console.warn('auth not loaded yet'); }

  async function ensureAdmin(){
    if(!auth || !auth.isLogged() || !auth.isAdmin()){
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  function qsAll(sel){ return Array.from(document.querySelectorAll(sel)) }

  function showView(name){
    qsAll('.admin-view').forEach(v=>v.style.display='none');
    const el = document.getElementById('view-'+name);
    if(el) el.style.display = '';
  }

  function setActiveButton(btn){
    qsAll('.admin-menu button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  }

  document.addEventListener('DOMContentLoaded', async function(){
    await ensureAdmin();
    // menu clicks
    qsAll('.admin-menu button[data-view]').forEach(btn=>{
      btn.addEventListener('click', function(){ setActiveButton(this); showView(this.getAttribute('data-view')); });
    });

    document.getElementById('sidebarLogout').addEventListener('click', function(){ auth.logout(); window.location.href='index.html'; });

    // article form submit (file upload not implemented server-side) - send title + date
    const form = document.getElementById('articleForm');
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      const date = document.getElementById('artDate').value;
      const title = document.getElementById('artTitle').value.trim();
      // file handling: we'll just include file name in body if provided
      const f = document.getElementById('artFile').files[0];
      const body = f ? ('File: ' + f.name) : '';
      const token = auth.token();
      const res = await fetch('/api/articles', {
        method: 'POST', headers: { 'content-type':'application/json','authorization':'Bearer '+token },
        body: JSON.stringify({ title: title + (date?(' ('+date+')') : ''), body })
      });
      if(res.ok){ alert('Artikel ditambahkan'); form.reset(); } else { const d = await res.json(); alert('Gagal: '+(d.message||'')); }
    });

    // load reviews and messages when those views shown
    document.querySelector('[data-view="kelola-review"]').addEventListener('click', async function(){ await loadReviews(); });
    document.querySelector('[data-view="kelola-pesan"]').addEventListener('click', async function(){ await loadMessages(); });

    async function loadReviews(){
      const res = await fetch('/api/reviews');
      const d = await res.json();
      const container = document.getElementById('reviewsList'); container.innerHTML='';
      d.reviews.forEach(r=>{
        const el = document.createElement('div'); el.className='card'; el.style.padding='10px;margin-bottom:8px';
        el.innerHTML = `<strong>${escapeHtml(r.user_name)}</strong> — ${r.rating}★<p>${escapeHtml(r.comment)}</p>`;
        container.appendChild(el);
      });
    }

    async function loadMessages(){
      const token = auth.token();
      const res = await fetch('/api/messages',{headers:{'authorization':'Bearer '+token}});
      const d = await res.json();
      const container = document.getElementById('messagesList'); container.innerHTML='';
      if(d.messages) d.messages.forEach(m=>{
        const el = document.createElement('div'); el.className='card'; el.style.padding='10px;margin-bottom:8px';
        el.innerHTML = `<strong>${escapeHtml(m.name)}</strong> <small>${escapeHtml(m.email)}</small><p>${escapeHtml(m.message)}</p>`;
        container.appendChild(el);
      });
    }

    function escapeHtml(s){ return String(s||'').replace(/[&<>\"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] }) }

    // default view
    showView('dashboard');
  });
})();
