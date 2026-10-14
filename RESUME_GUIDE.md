# 🎯 PocketPaisa (गुल्लक) — Resume & Interview Master Guide

This guide is designed to help you describe **PocketPaisa (गुल्लक)** in technical interviews for **Full Stack Engineer / SDE-1 / Frontend / Backend** roles.

---

## 📄 Ready-to-Copy Resume Section

### **PocketPaisa (गुल्लक) — Real-Life Money Habit Coach & Micro-Savings Platform**
*Tech Stack:* **TypeScript, React 19, Node.js, Express, MongoDB (Mongoose), Stripe API, Recharts, Zod, JWT**  
*Links:* [GitHub Repository](#) | [Live Demo](#)

- **Architected and engineered PocketPaisa (गुल्लक)**, a consumer financial wellness web app solving everyday personal money leaks for students and young professionals through automated 50-30-20 budget envelopes and micro-savings goals.
- **Engineered an interactive "Can I Afford This?" (Bhai Le Lu Kya?) impulse-buy evaluation engine**, calculating real-time burn velocity and projecting how individual discretionary purchases impact the user's daily food allowance for the remaining days of the month.
- **Built Digital "Gullak" goal vaults with atomic deposit and withdrawal workflows**, enabling target-based savings (trips, gadgets, emergency funds) with visual milestone tracking and celebratory confetti feedback.
- **Implemented automated "Paisa Kahan Gaya?" leak detection algorithms using MongoDB aggregations**, identifying discretionary spending spikes across micro-categories (cutting chai, food delivery, weekend outings).
- **Integrated dual-mode payment architecture with Stripe Checkout API and a frictionless 1-click sandbox gateway**, allowing instant evaluation of subscription tier upgrades (Free vs. Pro) with verified database audit records.
- **Designed a 1-tap quick expense logging UX in React 19 and custom pure CSS design system**, cutting time-to-log for repetitive daily items (chai, commute, food orders) down to under 2 seconds.

---

## 🎙️ Top Interview Questions & How to Answer

### 1. "Tell me about PocketPaisa. What problem does it solve?"
> *"Most personal finance apps in the market are either complex corporate accounting spreadsheets or full of stock market trading jargon that normal people and college students don't use. I built PocketPaisa to solve the exact problem every fresher and student faces: 'By the 20th of the month, my pocket is empty and I don't know where my money went!' It has a 1-tap daily expense logger, a viral 'Bhai Le Lu Kya?' impulse buy checker that tells you if buying sneakers today will leave you eating Maggi for the next 15 days, a simple 50-30-20 rule tracker, and digital Gullak piggy banks for goals like Goa trips or a new phone."*

---

### 2. "How did you design the backend and database models?"
> *"I designed the backend using Node.js, Express, and TypeScript with MongoDB as the document database. The schema includes User models with baseline monthly pocket budgets, Transaction collections tagged by both category and 50-30-20 bucket (`needs`, `wants`, `savings`), and Gullak collections tracking current vs. target savings. All endpoints use Zod validation to ensure strict input safety, and JWT authorization middleware protects user data."*

---

### 3. "How does the 'Bhai Le Lu Kya?' Affordability Calculator work under the hood?"
> *"When a user inputs an item and price (e.g., Nike Sneakers for ₹4,500), the backend computes the total expenses so far this month, subtracts them from the user's monthly income to find remaining liquidity, and determines the days left in the month. It calculates their current daily allowance (e.g. ₹640/day) versus their new daily allowance if they make the purchase (e.g. ₹375/day). If the purchase consumes over 50% of remaining cash or drops daily food budget below critical thresholds, it returns an explicit warning with humorous, actionable advice."*

---

### 4. "How did you handle payments and subscriptions?"
> *"I integrated Stripe Checkout for subscriptions (PocketPaisa Pro at ₹99/mo). For local development and portfolio evaluators who don't have test cards, I also engineered an instant Sandbox simulation endpoint that completes test checkout in 1 click, elevates user permissions in MongoDB, and logs audit receipts. Both real Stripe and sandbox flows follow the same transaction ledger lifecycle."*
