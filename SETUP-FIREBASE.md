# TitlePerfect Firebase Setup

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project: **titleperfect** (or reuse existing GCP project)
3. Enable **Authentication** > Sign-in method > **Email/Password** + **Google**
4. Enable **Cloud Firestore** > Start in **production mode**
5. Deploy security rules: `firebase deploy --only firestore:rules`

## 2. Backend (Kat) — Service Account

1. Firebase Console > Project Settings > Service accounts > Generate new private key
2. Save JSON file somewhere safe (NOT in repo)
3. Set env var:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/titleperfect-firebase-sa.json"
   ```
4. Or add to `backend/.env`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/titleperfect-firebase-sa.json
   ```
5. Install dependency:
   ```bash
   pip install firebase-admin>=6.0.0
   ```

## 3. Frontend (Sam) — Firebase Web Config

Sam needs these values from Firebase Console > Project Settings > General > Your apps > Web app:

| Config Field         | Env Var / Constant          |
|----------------------|-----------------------------|
| `apiKey`             | `VITE_FIREBASE_API_KEY`     |
| `authDomain`         | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId`          | `VITE_FIREBASE_PROJECT_ID`  |
| `storageBucket`      | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId`  | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId`              | `VITE_FIREBASE_APP_ID`      |

Sam: Initialize Firebase in the extension, call `getAuth().currentUser.getIdToken()`, and pass as `Authorization: Bearer <token>` on all API calls.

## 4. Firestore Collections

| Collection      | Key              | Description                        |
|-----------------|------------------|------------------------------------|
| `users`         | `{uid}`          | Profile, tier, Stripe customer ID  |
| `subscriptions` | `{uid}`          | Stripe subscription state          |
| `usage`         | `{uid}_{YYYY-MM}`| Monthly analysis counters          |
| `analyses`      | auto-id          | Saved analysis results per user    |
| `waitlist`      | auto-id          | Pre-launch signups (no auth)       |

## 5. API Endpoints

| Method | Path              | Auth     | Description                     |
|--------|-------------------|----------|---------------------------------|
| GET    | `/api/user/profile` | Bearer | Get/create user profile         |
| GET    | `/api/user/usage`   | Bearer | Current month usage count       |
| POST   | `/api/v1/analyze`   | Bearer | Analyze title (usage-gated)     |

## 6. Checklist

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password + Google)
- [ ] Firestore database created in production mode
- [ ] Service account JSON generated and saved
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` set in backend env
- [ ] `firebase-admin` installed in backend venv
- [ ] `firestore.rules` deployed
- [ ] Sam has Firebase web config values
- [ ] Frontend sends Bearer token on API calls
- [ ] Test: login -> analyze -> verify usage increments
