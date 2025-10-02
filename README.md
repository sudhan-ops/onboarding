# Paradigm Employee Onboarding — Run & Deploy

<div align="center">
  <img width="1200" height="475" alt="Paradigm Onboarding Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

This repository contains the **React + TypeScript + Vite** onboarding application for **Paradigm Employee Onboarding**.  
It provides a modern web interface for managing employee onboarding, integrated with **Firebase Authentication**, **Firestore**, and **Gemini AI APIs**.

---

## 🚀 Run Locally

**Prerequisites:** Node.js (16+) and npm

1. Clone this repo:
   ```bash
   git clone https://github.com/sudhan-ops/onboarding.git
   cd onboarding
Install dependencies:

bash
Copy code
npm install
Set the required environment variables in .env.local (see below).

Run the app:

bash
Copy code
npm run dev
The app will be available at http://localhost:5173 (or whichever port Vite is configured for).

⚙️ Environment Variables
Create a file .env.local at the project root:

ini
Copy code
# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
Do not commit .env.local to GitHub. Add it to .gitignore.

🔐 Firebase Setup
Go to Firebase Console.

Enable Email/Password and Google authentication.

Add localhost in Authentication → Authorized domains.

Copy your config values into .env.local.

📦 GitHub Deployment
Initialize Git & push:

bash
Copy code
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/sudhan-ops/onboarding.git
git branch -M main
git push -u origin main
(Optional) Deploy using Firebase Hosting, Netlify, or Vercel.

🛠️ Tech Stack
React + TypeScript

Vite (bundler/dev server)

Firebase (Auth + Firestore)

Gemini AI (Generative AI integration)

📖 License
© 2025 Paradigm Services. All rights reserved.

yaml
Copy code

---

✅ This replaces the **Google AI Studio banner** with your own **Paradigm banner** and makes the README project-focused instead of AI Studio–focused.  

👉 Do you want me to **generate a clean Paradigm banner image** (like a professional da
