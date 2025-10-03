# 🌐 Paradigm Employee Onboarding — Run & Deploy

<div align="center">
  <img width="1000" alt="Paradigm Onboarding Banner" src="http://paradigmfms.com/wp-content/uploads/2022/11/Paradigm-Logo-3-1024x157.png" />
</div>

Welcome to the **Paradigm Employee Onboarding Platform** 🚀  
A modern onboarding solution built with **React + TypeScript + Vite**, powered by **Firebase Authentication**, **Firestore**, and **Gemini AI APIs**.  

This app streamlines employee onboarding, document management, and integrations with Indian compliance portals like **ESIC, EPF, and UAN**.

---

## ⚡ Features

- 🔐 Secure login with **Firebase Authentication** (Email/Password + Google Sign-in)  
- 🗄️ Data storage & retrieval via **Firestore**  
- 🤖 AI-powered form automation using **Gemini API**  
- 📊 Modern **React + Vite** frontend  
- ☁️ Easy deployment to **Firebase Hosting**, **Netlify**, or **Vercel**  

---

## 🚀 Run Locally

### Prerequisites
- Node.js **16+**
- npm or yarn
- Firebase project & API keys
- Gemini API key

### Steps

1. **Clone the repo**
   ```bash
   git clone https://github.com/sudhan-ops/onboarding.git
   cd onboarding

2. **Install dependencies**
   ```bash
   npm install
   
3. **Create .env.local in the root folder with:**
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id

4. **Run the dev server**
   ```bash
   npm run dev
   
Visit 👉 http://localhost:5173

5.**Firebase Setup**
   ```bash
   Go to Firebase Console

Authentication → Sign-in method → enable Email/Password and Google Sign-in

Authentication → Authorized domains → add:



🛠️ Tech Stack

⚛️ React + TypeScript — UI framework

⚡ Vite — Fast dev/build tool

🔐 Firebase Authentication — User login & management

🗄️ Firestore — Cloud database

🤖 Gemini API — AI-powered automation

📖 License

© 2025 Paradigm Services. All rights reserved.

