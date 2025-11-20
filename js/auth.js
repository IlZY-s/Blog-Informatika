// Client-side auth using backend API
const auth = (function(){
  const API = '/api';

  async function login(email,password){
    const res = await fetch(API + '/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password})});
    if(!res.ok) return {ok:false,message:(await res.json()).message||'Login failed'}
    const data = await res.json();
    localStorage.setItem('ps_token', data.token);
    localStorage.setItem('ps_role', data.role);
    localStorage.setItem('ps_name', data.name||'');
    return {ok:true,role:data.role};
  }

  function logout(){ localStorage.removeItem('ps_token'); localStorage.removeItem('ps_role'); localStorage.removeItem('ps_name'); }

  function token(){ return localStorage.getItem('ps_token') }
  function role(){ return localStorage.getItem('ps_role') }
  function isAdmin(){ return role() === 'admin' }
  function isLogged(){ return !!token() }

  async function signup(email,password,name){
    const res = await fetch(API + '/signup',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password,name})});
    return res.ok ? {ok:true} : {ok:false, message:(await res.json()).message }
  }

  async function me(){
    const t = token(); if(!t) return null;
    const res = await fetch(API + '/me',{headers:{'authorization':'Bearer '+t}});
    if(!res.ok) return null; const d = await res.json(); return d.user;
  }

  return {login,logout,token,role,isAdmin,isLogged,signup,me};
})();

// handle legacy inline form handler
async function handleLogin(evt){
  evt.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const res = await auth.login(email,password);
  if(res.ok){
    if(res.role === 'admin') window.location.href = 'admin.html';
    else window.location.href = 'index.html';
  } else {
    alert('Login gagal: ' + (res.message || 'Cek kredensial'));
  }
  return false;
}

if(typeof window !== 'undefined') window.auth = auth;
