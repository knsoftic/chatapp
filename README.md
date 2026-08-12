# Production-Ready One-to-One Chat Application

A complete **cross-platform one-to-one chat application** built with **React Native (Expo)** for **Android**, **iOS**, and **Web**, backed by a scalable **Node.js + Express + Socket.IO** backend with **MySQL** (via XAMPP) database.

---

## Features

- 📱 **Cross-Platform**: Works seamlessly on Android, iOS, Web, Tablets, and Desktop Browsers.
- 🔑 **Mobile-Number-Based Authentication**: Mobile number is the unique identity. OTP verification flow (Firebase / Dev Mode).
- 💬 **Real-time One-to-One Messaging**: Instant messaging powered by Socket.IO.
- 🎤 **Voice Messages**: Record, preview playback, upload, and stream voice notes with waveform UI.
- 📄 **Document Sharing**: Send and receive PDFs, Docs, Sheets, and Text files safely.
- 🟢 **Online/Offline Status**: Real-time online presence tracking with heartbeats.
- ✍️ **Typing Indicators**: Real-time "typing..." notification when partner is composing.
- 📦 **Idempotency & Duplicate Prevention**: Prevents double messages via `client_message_id` and unique constraints.
- 🔐 **Conversation Uniqueness**: Strict 1-on-1 participant pair constraint prevents duplicate conversations.
- 🔔 **Push Notifications**: Expo Push Notifications integration for Android and iOS.
- 🌓 **Dark / Light Theme**: Dynamic modern design with theme toggling.

---

## Tech Stack

### Frontend
- React Native + Expo (v51)
- TypeScript
- React Navigation v6
- Zustand (State Management)
- Axios (REST API Client)
- Socket.IO Client
- Expo AV (Voice Recording & Playback)
- Expo Document Picker
- Expo Push Notifications

### Backend
- Node.js + Express
- TypeScript
- Socket.IO Server
- MySQL / MariaDB (XAMPP compatible)
- Firebase Admin SDK (Storage & OTP integration)
- Expo Server SDK (Push Notifications)
- JWT Authentication (Access + Refresh tokens)
- Zod Request Validation & Rate Limiting

---

## Directory Structure

```text
chat app/
├── backend/                  ← Node.js Express Backend
│   ├── migrations/           ← MySQL SQL schema setup
│   ├── src/
│   │   ├── config/           ← Env, DB, Firebase configuration
│   │   ├── controllers/      ← REST API logic
│   │   ├── middleware/       ← JWT Auth, Rate limiting, Upload validation
│   │   ├── models/           ← MySQL model queries
│   │   ├── routes/           ← Express API routing
│   │   ├── services/         ← OTP, Storage, Push notifications
│   │   ├── sockets/          ← Socket.IO real-time events
│   │   └── server.ts         ← Main entry point
│   ├── package.json
│   └── .env.example
│
└── frontend/                 ← Expo React Native Frontend
    ├── src/
    │   ├── components/       ← Reusable UI components
    │   ├── screens/          ← App screens (Login, Chat, Settings, etc.)
    │   ├── navigation/       ← Stack navigation setup
    │   ├── services/         ← API, Socket, Storage, Push notification services
    │   ├── store/            ← Zustand auth & chat stores
    │   ├── theme/            ← Design system & themes
    │   └── types/            ← TypeScript definitions
    ├── App.tsx               ← Expo root application
    ├── app.json              ← Expo config
    └── package.json
```

---

## Setup & Running Instructions

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **XAMPP** (with MySQL running) or standalone MySQL Server
- **Expo Go App** on mobile phone (or Android Studio / Xcode emulator)

---

### 2. Configure Database (XAMPP MySQL)

1. Start **XAMPP Control Panel** and start **Apache** and **MySQL**.
2. Open phpMyAdmin (`http://localhost/phpmyadmin`).
3. Run the SQL migration script located at `backend/migrations/001_initial_schema.sql` or run the automated migration command:

```bash
cd backend
npm run migrate
```

---

### 3. Setup Backend Server

1. Navigate to the backend directory:
   ```bash
   cd "c:\xampp\htdocs\chat app\backend"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` settings:
   - Make sure `DB_HOST=localhost`, `DB_USER=root`, `DB_NAME=chat_app`.
   - `OTP_DEV_MODE=true` enables instant development mode with fixed OTP (`123456`).

5. Run Database Migrations:
   ```bash
   npm run migrate
   ```

6. Start Backend Development Server:
   ```bash
   npm run dev
   ```
   *The server will run on `http://localhost:5000`*

---

### 4. Setup Frontend Application

1. Navigate to the frontend directory:
   ```bash
   cd "c:\xampp\htdocs\chat app\frontend"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update API IP address in `src/constants/config.ts`:
   - Set `API_BASE_URL` and `SOCKET_URL` to your computer's local Wi-Fi IP address (e.g. `http://192.168.1.5:5000/api` and `http://192.168.1.5:5000`) so mobile devices on the network can connect.

4. Start Expo Development Server:
   ```bash
   npm run start
   ```

---

### 5. Running on Platforms

- **Web Browser**: Press `w` in terminal or run `npm run web`.
- **Android**: Press `a` in terminal (with Android Emulator running) or scan QR code in **Expo Go** app on physical Android device.
- **iOS**: Press `i` in terminal (on macOS) or scan QR code in **Expo Go** app on iPhone.

---

## OTP Authentication Flow

1. Enter phone number (e.g., `+92 300 1234567`).
2. If `OTP_DEV_MODE=true`, enter OTP `123456`.
3. New users proceed to **Profile Setup** (First name, Last name, Email).
4. Existing registered users log directly into the **Home Screen**.

---

## Building Production Releases

### Web Export
```bash
cd frontend
npm run build:web
```

### Android APK / Bundle (EAS Build)
```bash
cd frontend
eas build --platform android --profile production
```

### iOS App Store Build
```bash
cd frontend
eas build --platform ios --profile production
```

---

## Business Rules Summary

1. **One mobile number = one account**: Prevents duplicate account creation.
2. **Normalized Phone Numbers**: E.164 format normalization ensures consistent lookup.
3. **Idempotent Messages**: Unique constraint on `(sender_id, client_message_id)` prevents message duplication.
4. **Unique Conversation Pairs**: Strict SQL join check prevents duplicate conversations between the same two users.
5. **Secure Authentication**: Protected endpoints require valid JWT token. Socket connection requires token handshake.
