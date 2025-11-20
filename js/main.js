// small UI helpers
document.addEventListener('DOMContentLoaded', function(){
  // highlight nav active link if on login/admin
  const nav = document.querySelector('.main-nav');
  if(!nav) return;
  // Load articles on home
  async function loadArticles(){
    try{
      const res = await fetch('/api/articles');
      if(!res.ok) return;
      const d = await res.json();
      const container = document.getElementById('articles');
      if(!container) return;
      container.innerHTML = '';
      d.articles.forEach(a=>{
        const el = document.createElement('div');
        el.className = 'card feature-card';
        el.innerHTML = `<h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.body || '')}</p><small>By ${escapeHtml(a.author||'')}</small>`;
        container.appendChild(el);
      });
    }catch(err){console.error(err)}
  }

  function escapeHtml(str){ return String(str||'').replace(/[&<>\"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] }) }

  loadArticles();
});
