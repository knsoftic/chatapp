# 🌐 Hostinger & GitHub CI/CD Deployment Guide

This guide provides step-by-step instructions for deploying ChatApp's **Backend** (`chatappserver.knsoftic.com`) and **Frontend** (`chatapp.knsoftic.com`) to **Hostinger** using **GitHub Auto-Deployment**.

---

## 🏗️ Architecture Setup

- **Frontend Domain (`chatapp.knsoftic.com`)**: React Native Web Production build.
- **Backend Subdomain (`chatappserver.knsoftic.com`)**: Node.js + Express + Socket.IO Backend server.
- **MySQL Database**: Hostinger MySQL Database instance.

---

## 1. ⚙️ Backend Deployment on Hostinger (`chatappserver.knsoftic.com`)

### Step 1.1: Create MySQL Database on Hostinger
1. Log in to **Hostinger hPanel**.
2. Go to **Databases → Management**.
3. Create a new database:
   - **Database Name**: `chatapp_db`
   - **Username**: `chatapp_user`
   - **Password**: `YourStrongPassword123!`

### Step 1.2: Import Database Migration Schema
1. Open **phpMyAdmin** in Hostinger hPanel.
2. Select `chatapp_db`.
3. Go to the **Import** tab.
4. Upload `backend/migrations/001_initial_schema.sql` and click **Go**.

### Step 1.3: Deploy Node.js Backend Server
1. In Hostinger hPanel, go to **Advanced → Node.js App** (or VPS terminal).
2. Create a new Node.js App:
   - **App Root**: `backend`
   - **Domain/Subdomain**: `chatappserver.knsoftic.com`
   - **Application Startup File**: `dist/server.js`
3. Create `.env` in the backend folder on Hostinger with these production values:
   ```env
   PORT=5000
   NODE_ENV=production

   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=chatapp_db
   DB_USER=chatapp_user
   DB_PASSWORD=YourStrongPassword123!

   JWT_SECRET=production_super_jwt_secret_key_99
   JWT_REFRESH_SECRET=production_super_refresh_secret_key_99

   SMS_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=+13867498045

   OTP_DEV_MODE=false
   PUBLIC_BASE_URL=https://chatappserver.knsoftic.com
   CORS_ORIGIN=https://chatapp.knsoftic.com
   ```
4. Run npm install & build:
   ```bash
   npm install --production
   npm run build
   ```
5. Click **Start App** / restart Node server.

---

## 2. 🌐 Frontend Web Deployment on Hostinger (`chatapp.knsoftic.com`)

### Step 2.1: Verify Production API Endpoint
In `frontend/src/constants/config.ts`:
```typescript
export const API_BASE_URL = __DEV__
  ? 'http://192.168.100.212:5000/api'
  : 'https://chatappserver.knsoftic.com/api';

export const SOCKET_URL = __DEV__
  ? 'http://192.168.100.212:5000'
  : 'https://chatappserver.knsoftic.com';
```

### Step 2.2: Export Production Web Build
Run in `frontend` folder:
```bash
npx expo export --platform web
```
This generates a static production web bundle in `frontend/dist/`.

### Step 2.3: Upload Web Build to Hostinger
1. In Hostinger hPanel, open **File Manager**.
2. Go to `chatapp.knsoftic.com` domain folder (`public_html`).
3. Upload all files from `frontend/dist/` into `public_html/`.
4. Open `https://chatapp.knsoftic.com` in your browser!

---

## 🔄 3. GitHub Auto-Deployment Setup

### Step 3.1: Push Code to GitHub
```bash
git add .
git commit -m "Configure production domains chatapp.knsoftic.com and chatappserver.knsoftic.com"
git push origin main
```

### Step 3.2: Configure Hostinger Git Auto-Deployment
1. In Hostinger hPanel, go to **Advanced → Git**.
2. Click **Create a New Repository**:
   - **Repository URL**: `https://github.com/knsoftic/chatapp.git`
   - **Branch**: `main`
   - **Directory**: `public_html`
3. Copy the **Auto Deployment Webhook URL** provided by Hostinger.
4. Go to your **GitHub Repository → Settings → Webhooks → Add Webhook**.
5. Paste the Hostinger Webhook URL and select **Just the push event**.

🎉 **Every git push to `main` branch will automatically deploy your code live to Hostinger!**
