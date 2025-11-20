# Program Studi Informatika - Static Demo

Simple static website demo with:

- `index.html` — Landing / home page
- `login.html` — Login form (client-side demo)
- `admin.html` — Admin dashboard (protected via localStorage session)

Demo credentials (client-side only):

- Admin: `admin@example.com` / `admin123`
- User: `user@example.com` / `user123`


How to run (Windows PowerShell):

Option A — Static only (quick):

```powershell
cd "e:\Joki WEB\PPL BAYU"
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

Option B — Full demo with backend (recommended):

```powershell
cd "e:\Joki WEB\PPL BAYU"
npm install
npm start
# backend listens on port 4000, open http://localhost:4000
```

Or use the Live Server extension in VS Code (open the folder and click "Go Live").

Notes:
- The repository now contains a minimal Node.js backend with SQLite, JWT auth, and bcrypt password hashing.
- For a quick static preview you can still use Option A, but the full demo requires running the Node server (Option B).

Database and security updates:
- The server uses SQLite and will create `db.sqlite` on first run by applying `migrations.sql`.
- Passwords are stored hashed with `bcrypt` and authentication is JWT-based. Set `JWT_SECRET` environment variable to a secure value in production.

Run with a custom JWT secret (PowerShell):
```powershell
$env:JWT_SECRET = 'your_secret_here'; npm start
```

Limitations:
- This is still a demo: the DB is file-based SQLite (suitable for development). For production use a managed DB and hardened configuration.
- Tokens are signed with a secret; don't commit secrets to source control.

If you want, I can:
- Add edit (PUT) endpoints for articles and reviews.
- Switch the DB to PostgreSQL or add a simple admin UI for messages.
- Improve styling to fully match the provided screenshots.
 
Deployment to Vercel + Supabase
--------------------------------
Below are step-by-step instructions to deploy this project to Vercel (frontend) and Supabase (Postgres + storage). I cannot push to your GitHub for you, but the steps and git commands are provided so you can commit and connect the repo to Vercel.

1) Create a GitHub repo and push the project

```powershell
cd "e:\Joki WEB\PPL BAYU"
git init
git add .
git commit -m "Initial commit: PS Informatika site"
# Create a repo on GitHub (via web) then:
git remote add origin https://github.com/<your-user>/<your-repo>.git
git branch -M main
git push -u origin main
```

2) Create a Supabase project
- Go to https://app.supabase.com and create a new project.
- In the Supabase project, open the SQL editor and paste the contents of `supabase.sql` (this will create tables). Run it.
- Optionally enable Supabase Auth (recommended) for user management.
- In the Supabase UI, go to Settings → API and copy the `SUPABASE_URL` and `anon/public` key (or service role key as needed).

3) Configure environment variables in Vercel
- Go to https://vercel.com and import your GitHub repository.
- In the Vercel project Settings → Environment Variables, add:
	- `SUPABASE_URL` = (value from Supabase)
	- `SUPABASE_ANON_KEY` = (anon/public key)
	- `SUPABASE_SERVICE_KEY` = (service_role key) — only if you need server-side privileged operations
	- `JWT_SECRET` = a secure string (for local dev server only)

4) Deploy
- Once the repo is connected, Vercel will deploy your site automatically on push. The static frontend will be served. If you add serverless API files under `/api`, Vercel will deploy them as functions.

Notes about backend & migration
- This repo currently contains a local Node Express server (`server.js`) using SQLite for local development. For production on Vercel + Supabase, you should:
	- Migrate server endpoints to serverless functions under `/api` using `@vercel/node` that call Supabase via `@supabase/supabase-js`, or
	- Host the Node server on a platform that supports a persistent process (Fly.io / Render) and connect it to Supabase.

If you want, I can convert the current server endpoints to Vercel serverless functions that use Supabase client and then provide the exact steps to deploy (I will prepare the `/api` routes and necessary changes). Tell me if you want me to implement the API conversion now.
