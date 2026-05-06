# ══════════════════════════════════════════════════════════════════════
# NIRIKSHAK AI — DEPLOYMENT GUIDE
# Deploy: React → Vercel | Spring Boot + Python AI + DB → Render
# ══════════════════════════════════════════════════════════════════════

## STEP 1 — Push to GitHub
```bash
cd "Nirikshak AI"
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/nirikshak-ai.git
git push -u origin main
```

---

## STEP 2 — Deploy Backend on Render

### 2a. Create a free account at https://render.com

### 2b. Deploy Python AI Service
1. Click **New → Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Name**: `nirikshak-python-ai`
   - **Root Directory**: `python-ai`
   - **Runtime**: Docker
   - **Plan**: Free
4. Click **Deploy**
5. Copy the URL: `https://nirikshak-python-ai.onrender.com`

### 2c. Create PostgreSQL Database
1. Click **New → PostgreSQL**
2. Settings:
   - **Name**: `nirikshak-db`
   - **Plan**: Free
3. Click **Create** → Copy the **Internal Database URL**

### 2d. Deploy Spring Boot Backend
1. Click **New → Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Name**: `nirikshak-springboot`
   - **Root Directory**: `backend`
   - **Runtime**: Docker
   - **Plan**: Free
4. Add **Environment Variables**:
   ```
   SPRING_DATASOURCE_URL     = <Internal Database URL from step 2c>
   SPRING_DATASOURCE_USERNAME = nirikshak
   SPRING_DATASOURCE_PASSWORD = <password from Render DB>
   JWT_SECRET                 = <any random 48-char string>
   AI_VISION_SERVICE_URL      = https://nirikshak-python-ai.onrender.com
   ```
5. Click **Deploy**
6. Copy the URL: `https://nirikshak-springboot.onrender.com`

---

## STEP 3 — Run Flyway Migrations on Render DB

After Spring Boot deploys, it will run Flyway migrations automatically.
No manual SQL needed.

---

## STEP 4 — Deploy Frontend on Vercel

### 4a. Create a free account at https://vercel.com

### 4b. Import Project
1. Click **Add New → Project**
2. Import your GitHub repo
3. Settings:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 4c. Add Environment Variables
In Vercel dashboard → Settings → Environment Variables:
```
REACT_APP_BACKEND_URL = https://nirikshak-springboot.onrender.com
REACT_APP_WS_URL      = wss://nirikshak-springboot.onrender.com
```

### 4d. Redeploy
Click **Redeploy** so the env vars take effect.

---

## STEP 5 — Test
Open your Vercel URL (e.g., `https://nirikshak-ai.vercel.app`)
Login: `demo@nirikshak.ai` / `demo1234`

---

## Final Architecture

```
Browser → Vercel (React)
              ↓
         Render (Spring Boot :8080)
              ↓                    ↓
   Render PostgreSQL        Render (Python AI :8000)
```

---

## ⚠️ Free Tier Notes
- Render services **sleep after 15 min of inactivity** (first request = ~30s wait)
- Render free PostgreSQL **expires after 90 days** (upgrade or re-create)
- Vercel frontend is **always on** with no sleep
