const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');

const MIGRATIONS = path.join(__dirname,'migrations.sql');
const DB_FILE = path.join(__dirname,'db.sqlite');
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

function ensureDb(){
  const exists = fs.existsSync(DB_FILE);
  const db = new Database(DB_FILE);
  if(!exists){
    const mig = fs.readFileSync(MIGRATIONS,'utf8');
    db.exec(mig);
  }
  return db;
}

const db = ensureDb();

// seed default admin/user if none exist
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if(userCount === 0){
  const adminPass = bcrypt.hashSync('admin123',10);
  const userPass = bcrypt.hashSync('user123',10);
  const now = new Date().toISOString();
  const insert = db.prepare('INSERT INTO users(email,password,role,name,created_at) VALUES(?,?,?,?,?)');
  insert.run('admin@example.com', adminPass, 'admin', 'Administrator', now);
  insert.run('user@example.com', userPass, 'user', 'Demo User', now);
  const artIns = db.prepare('INSERT INTO articles(id,title,body,author,created_at) VALUES(?,?,?,?,?)');
  artIns.run('a1','Selamat Datang di Program Studi Informatika','Ini adalah artikel pembuka tentang program studi kami.','Administrator', now);
}

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/', express.static(path.join(__dirname)));

function signToken(u){ return jwt.sign({id:u.id,role:u.role,email:u.email,name:u.name}, JWT_SECRET, {expiresIn:'7d'}) }

function verifyToken(token){ try{ return jwt.verify(token, JWT_SECRET) }catch(e){ return null } }

function authMiddleware(req,res,next){
  const header = req.headers['authorization'] || '';
  const token = header.replace(/^Bearer\s+/i,'');
  const payload = verifyToken(token);
  if(!payload) return res.status(401).json({ok:false,message:'Unauthorized'});
  req.user = payload;
  next();
}

function adminOnly(req,res,next){ if(req.user && req.user.role === 'admin') return next(); return res.status(403).json({ok:false,message:'Forbidden'}); }

app.post('/api/login', (req,res)=>{
  const {email,password} = req.body || {};
  if(!email || !password) return res.status(400).json({ok:false,message:'Missing fields'});
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if(!row) return res.status(401).json({ok:false,message:'Invalid credentials'});
  const ok = bcrypt.compareSync(password, row.password);
  if(!ok) return res.status(401).json({ok:false,message:'Invalid credentials'});
  const token = signToken(row);
  res.json({ok:true,token,role:row.role,name:row.name});
});

app.post('/api/signup', (req,res)=>{
  const {email,password,name} = req.body || {};
  if(!email || !password) return res.status(400).json({ok:false,message:'Missing fields'});
  const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if(exists) return res.status(400).json({ok:false,message:'Email already used'});
  const hash = bcrypt.hashSync(password,10);
  const now = new Date().toISOString();
  db.prepare('INSERT INTO users(email,password,role,name,created_at) VALUES(?,?,?,?,?)').run(email,hash,'user',name||'User',now);
  res.json({ok:true});
});

app.get('/api/me', authMiddleware, (req,res)=>{
  const row = db.prepare('SELECT id,email,role,name FROM users WHERE id=?').get(req.user.id);
  res.json({ok:true,user:row});
});

app.get('/api/articles', (req,res)=>{
  const rows = db.prepare('SELECT id,title,body,author,created_at FROM articles ORDER BY created_at DESC').all();
  res.json({ok:true,articles:rows});
});

app.get('/api/articles/:id', (req,res)=>{
  const row = db.prepare('SELECT id,title,body,author,created_at FROM articles WHERE id=?').get(req.params.id);
  if(!row) return res.status(404).json({ok:false});
  res.json({ok:true,article:row});
});

app.post('/api/articles', authMiddleware, adminOnly, (req,res)=>{
  const {title,body} = req.body || {};
  if(!title) return res.status(400).json({ok:false,message:'Title required'});
  const id = require('crypto').randomBytes(8).toString('hex');
  const now = new Date().toISOString();
  db.prepare('INSERT INTO articles(id,title,body,author,created_at) VALUES(?,?,?,?,?)').run(id,title,body||'',req.user.name || req.user.email,now);
  const art = db.prepare('SELECT id,title,body,author,created_at FROM articles WHERE id=?').get(id);
  res.json({ok:true,article:art});
});

app.delete('/api/articles/:id', authMiddleware, adminOnly, (req,res)=>{
  const id = req.params.id;
  const info = db.prepare('DELETE FROM articles WHERE id = ?').run(id);
  if(info.changes === 0) return res.status(404).json({ok:false});
  res.json({ok:true});
});

// Reviews
app.get('/api/reviews', (req,res)=>{
  const rows = db.prepare('SELECT id,user_name,rating,comment,created_at FROM reviews ORDER BY created_at DESC').all();
  res.json({ok:true,reviews:rows});
});

app.post('/api/reviews', authMiddleware, (req,res)=>{
  const {rating,comment} = req.body || {};
  const now = new Date().toISOString();
  db.prepare('INSERT INTO reviews(user_id,user_name,rating,comment,created_at) VALUES(?,?,?,?,?)').run(req.user.id, req.user.name || req.user.email, rating||0, comment||'', now);
  res.json({ok:true});
});

app.delete('/api/reviews/:id', authMiddleware, adminOnly, (req,res)=>{
  const info = db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
  res.json({ok:true,deleted:info.changes});
});

// Messages
app.post('/api/messages', (req,res)=>{
  const {name,email,message} = req.body || {};
  const now = new Date().toISOString();
  db.prepare('INSERT INTO messages(name,email,message,created_at) VALUES(?,?,?,?)').run(name||'',email||'',message||'',now);
  res.json({ok:true});
});

app.get('/api/messages', authMiddleware, adminOnly, (req,res)=>{
  const rows = db.prepare('SELECT id,name,email,message,created_at FROM messages ORDER BY created_at DESC').all();
  res.json({ok:true,messages:rows});
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=>console.log('Server started on',PORT));
