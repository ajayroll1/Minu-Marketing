# Deployment Guide: Render (Backend) & Vercel (Frontend)

Minu Marketing Enterprise Inventory Management System is production-configured for a decoupled architecture:
- **Backend**: Python Django + Gunicorn + WhiteNoise + PostgreSQL hosted on **Render**.
- **Frontend**: React (Vite) Single Page Application hosted on **Vercel**.

---

## 1. Render Deployment (Backend API & Database)

### Option A: Automatic Blueprint Deployment (Recommended)
1. Push this repository to GitHub / GitLab.
2. Log into [Render Dashboard](https://dashboard.render.com).
3. Click **New +** &rarr; **Blueprint**.
4. Select your repository `Minu-Marketing`.
5. Render will automatically detect [`render.yaml`](file:///c:/Users/LENOVO/Desktop/Task/render.yaml) and provision:
   - **PostgreSQL Database**: `minu-marketing-db`
   - **Web Service**: `minu-marketing-backend` with build script `build.sh` (installs dependencies, runs migrations, collects static assets).
6. Click **Apply**.

### Option B: Manual Web Service Setup on Render
1. Click **New +** &rarr; **Web Service**.
2. Connect your Git repository.
3. Configure the settings:
   - **Runtime**: `Python`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn project.wsgi:application --bind 0.0.0.0:$PORT --workers 3`
4. Add Environment Variables:
   - `PYTHON_VERSION`: `3.11.9`
   - `DJANGO_DEBUG`: `False`
   - `DJANGO_SECRET_KEY`: `<generate-a-strong-secret-key>`
   - `DATABASE_URL`: `<Internal Connection String from Render Postgres>`
   - `DJANGO_ALLOWED_HOSTS`: `.onrender.com,localhost,127.0.0.1`
   - `CORS_ALLOWED_ORIGINS`: `https://your-app.vercel.app,http://localhost:5173`
   - `CSRF_TRUSTED_ORIGINS`: `https://*.onrender.com,https://*.vercel.app`
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `587`
   - `SMTP_USER`: `your-email@gmail.com`
   - `SMTP_PASS`: `<gmail-app-password>`
   - `SMTP_FROM_EMAIL`: `Minu Marketing Notifications <your-email@gmail.com>`
   - `ALERT_RECIPIENT_EMAIL`: `warehouse-admin@domain.com`

---

## 2. Vercel Deployment (Frontend SPA)

1. Log into [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** &rarr; **Project**.
3. Import your Git repository `Minu-Marketing`.
4. In the Project Configuration:
   - **Root Directory**: Click *Edit* and select **`frontend`**.
   - **Framework Preset**: `Vite` (Auto-detected).
   - **Build Command**: `vite build` or `npm run build` (Default).
   - **Output Directory**: `dist` (Default).
5. In **Environment Variables**, add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://<your-render-backend-service-name>.onrender.com` *(e.g. `https://minu-marketing-backend.onrender.com`)*
6. Click **Deploy**.

---

## 3. Initial Superuser Setup on Render

After your Render service is deployed and live, open the Render **Shell** tab and create your administrator:

```bash
python manage.py createsuperuser
```

Enter your username and password, then log into your Vercel frontend URL to manage inventory!
