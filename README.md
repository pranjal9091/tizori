# 🐷 PocketPaisa — Personal Financial Habit Coach & Micro-Savings Operating System

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF)](https://razorpay.com/)
[![Google Identity](https://img.shields.io/badge/Google_OAuth-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://developers.google.com/identity)

**PocketPaisa** is a modern, disciplined personal financial management platform and behavioral habit coach designed for students, freshers, and early-career professionals. Built with an editorial aesthetic and high-performance full-stack TypeScript architecture, it transforms complex financial spreadsheets into actionable everyday habits: real-time impulse purchase affordability diagnostics, goal-based savings vaults, 1-tap ledger entries, automated 50-30-20 cashflow budgeting, and recurring bill tracking.

---

## 🌟 Core Architecture & Key Features

### 1. ⚡ 1-Tap Daily Expense Logging & Kharcha Diary
- Quick logging for everyday refreshments, transit, meals, and utilities with zero friction.
- 5-second undo toast action powered by optimistic UI updates.
- Categorized financial ledger with instant search, category filters, and monthly export.

### 2. 🧠 Real-Time Impulse Affordability Engine ("Can I Afford This?")
- Evaluates non-essential purchases before you spend money.
- Calculates your remaining daily safe spend for the rest of the billing cycle.
- Mathematical impact projection: displays how purchasing an item today affects your daily allowance for the remaining days of the month.
- Context-driven verdict: *Safe to Purchase*, *Wait & Save in Goal Vault*, or *Not Recommended*.

### 3. 🎯 Goal-Based Savings Vaults ("Digital Gullaks")
- Target-based savings pots for workstations, travel, certifications, and emergency reserves.
- Milestone celebration animations (confetti) and progress trackers.
- **Direct Vault Funding via Payment Gateway**: Deposit money directly into goal vaults via instant UPI (Google Pay, PhonePe, Paytm), Credit/Debit Card, or NetBanking with verified 256-bit encrypted digital receipts.

### 4. 📊 50-30-20 Budget Allocation & Spending Leak Detector
- Dynamic automated distribution of income into **Needs (50%)**, **Wants (30%)**, and **Savings (20%)**.
- Micro-leakage diagnostics: automatically detects compounding micro-purchases (coffee, frequent rides, delivery markups) and highlights monthly cashflow drains.

### 5. 📅 Recurring Subscriptions & Monthly Burn Tracker
- Tracks recurring fixed commitments (WiFi, OTT streaming, gym memberships, software subscriptions).
- Calculates total monthly fixed burn and days until next renewal.
- 1-tap "Pay & Log" workflow to record payments directly into the ledger.

### 6. 🔐 Dual Authentication: Real Google OAuth & Credential Auth
- **Google Identity Services (GIS)**: Cryptographically verified Google JWT ID tokens against Google's public tokeninfo endpoint with automatic user provisioning.
- **Set & Confirm Password Validation**: Dedicated password confirmation with live matching verification indicators and visibility toggles.
- **Automated Gmail Security Alerts**: Sends instant security notifications on new logins via Nodemailer SMTP.

### 7. 💳 Production Payment Gateway Integration
- **Razorpay Integration**: Native checkout modal supporting Indian UPI apps (GPay, PhonePe, Paytm, BHIM, QR codes), Credit/Debit Cards, and NetBanking.
- **Cryptographic Signature Verification**: HMAC-SHA256 verification of payment signatures before tier provisioning.
- **Global Stripe Checkout & 1-Click Evaluation Sandbox**: Zero-money test mode tailored for portfolio evaluators and technical recruiters.

### 8. ☁️ Database Portability & Cloud Sync
- Dual-engine design: seamless zero-configuration embedded in-memory MongoDB for instant local development + production MongoDB Atlas cloud cluster synchronization.
- Full JSON snapshot export/restore and CSV ledger downloads.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Vanilla CSS Design System, Lucide Icons, Canvas Confetti |
| **Backend** | Node.js, Express.js, TypeScript, TSX |
| **Database & ORM** | MongoDB Atlas, Mongoose, MongoMemoryServer (development fallback) |
| **Authentication** | Google Identity Services (GSI), JWT (JSON Web Tokens), BCrypt.js |
| **Payments** | Razorpay SDK, Stripe SDK |
| **Communications** | Nodemailer SMTP (Gmail Security Alerts & Deposit Receipts) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ (tested on Node v20/v22/v24)
- npm v9+

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/pranjal9091/tizori.git
cd tizori
npm run install:all
```

### 2. Configure Environment Variables
Copy `.env.example` to `server/.env`:
```bash
cp server/.env.example server/.env
```
*(PocketPaisa includes smart defaults—if left empty, it runs with zero setup using in-memory MongoDB and sandbox payment evaluation!)*

### 3. Launch Development Servers
```bash
npm run dev
```

- **Web Application:** `http://localhost:3000`
- **Backend API Server:** `http://localhost:5001`
- **Health Check Endpoint:** `http://localhost:5001/api/health`

### 4. 1-Click Demo Evaluation
On the login screen, click **"Continue as Aman Verma"** to immediately explore the pre-seeded, rich financial dashboard.

---

## 📄 License
MIT License. Built by [Pranjal Singh](https://github.com/pranjal9091).
