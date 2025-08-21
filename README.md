# 🌳 Diabetree-App

**Your Sweet Companion for Diabetes Management!**

---

## 📖 Introduction

Welcome to **Diabetree**, a friendly mobile app designed to help you manage your diabetes with a touch of fun and motivation.  
Tracking glucose levels can feel like a chore, so we added a **gamified twist**: nurturing your very own virtual tree!  
The more consistently you log your readings and stay within range, the more your tree will flourish. Think of it as a little green buddy cheering you on.

<img src="docs/images/homescreen.png" alt="Diabetree App Home Screen with Tree" width="50%"/>

---

## ✨ Features

- **Easy Glicemia Tracking** – Quickly log your blood glucose levels.
    <img src="docs/images/insertglicemiascreen.png" alt="Glicemia Screen" width="50%"/>
- **Contextual Notes** – Add details about meals, activities, or other influences.
- **Interactive Tree Growth** – Watch your virtual tree grow as you stay consistent.
- **Achievements & Rewards** – Unlock badges and earn coins for milestones.
    <img src="docs/images/achievementsscreen.png" alt="Achievements Screen" width="50%"/>
- **Diabetree Shop** – Spend coins on new tree seeds to expand your collection.
    <img src="docs/images/shopscreen.png" alt="Shop Screen" width="50%"/>
- **Personal Profile** – Store insulin info and set personal glucose targets.
- **Local Data Storage** – All data is stored locally via JSON-server for privacy.

---

## ❓ Why Diabetree?

Managing diabetes is a marathon, not a sprint.  
**Diabetree** makes the journey more engaging by turning **routine into reward**.  
Plus… who doesn’t love growing a virtual forest? 🌱

---

## 🚀 Getting Started

### 📦 Prerequisites

Make sure you have installed:

- [Node.js (LTS recommended)](https://nodejs.org/)
- npm or Yarn
- Expo CLI → `npm install -g expo-cli`
- Mobile emulator (Android Studio / Xcode) **or** a physical device.

---

### 🔧 Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/tiagogalvao7/diabetree-app.git
cd diabetree-app
```

#### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

#### 3. Set Up Local API (JSON-server)

**Install JSON-server globally:**

```bash
npm install -g json-server
```

#### 4. Configure Environment Variables

Create a `.env` file in the project root with:

```bash
API_BASE_URL=http://10.0.2.2:3000
```

Adjust the address depending on your environment.

#### 5. Run the App

```bash
npm start
# or
expo start
```

#### Then in Expo Dev Tools:

- Press a → Run on Android
- Press i → Run on iOS
- Scan QR code with Expo Go app on your phone

### 🛠️ Technologies Used

- **React Native** – Cross-platform app development
- **Expo** – Simplified universal React framework
- **TypeScript** – Strong typing for robust code
- **JSON-server** – Lightweight local REST API
- **Async Storage** – Persistent key-value storage
- **Expo Vector Icons** – Rich icon set
- **Expo Haptics** – Subtle tactile feedback

### 🌱 Future Enhancements

- **☁️ Cloud Sync** – Backup and multi-device support
- **📊 Advanced Analytics** – More detailed glucose trend reports
- **🔗 Device Integration** – Connect with glucose monitors or simulate with Arduino hardware
- **🌲 New Content** – More tree types, items, and challenges
