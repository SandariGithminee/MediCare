# 🏥 Medicare — Hospital Management System (MERN Stack)

A full-stack, colorful Hospital Management System built with **MongoDB, Express, React, Node.js** and styled entirely with **Tailwind CSS**.

Based on the HMS specification: patient management, doctor management, appointments, billing, dashboard analytics, and role-based authentication.

---

## 📁 Project Structure

```
medicare-hms/
├── backend/          # Node.js + Express + MongoDB REST API
│   ├── config/       # Database connection
│   ├── controllers/  # Route logic
│   ├── middleware/   # Auth + error handling
│   ├── models/       # Mongoose schemas (User, Patient, Doctor, Appointment, Billing, Department)
│   ├── routes/       # API routes
│   ├── server.js     # Entry point
│   └── seed.js        # Demo data seeder
│
└── frontend/         # React (Vite) + Tailwind CSS
    └── src/
        ├── api/         # Axios instance
        ├── components/  # Sidebar, Navbar, Layout, Modal, StatCard, Badge
        ├── context/     # AuthContext (JWT auth)
        └── pages/       # Landing, Login, Register, Dashboard, Patients, Doctors, Appointments, Billing
```

---

## ⚙️ Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org))
- **MongoDB** — either:
  - Installed locally ([download](https://www.mongodb.com/try/download/community)), or
  - A free **MongoDB Atlas** cluster ([mongodb.com/atlas](https://www.mongodb.com/atlas)) — recommended if you don't want to install MongoDB locally.

---

## 🚀 Setup Instructions (Antigravity / any local IDE)

### 1. Extract the zip
Unzip `medicare-hms.zip` and open the `medicare-hms` folder in your editor.

### 2. Backend Setup

```bash
cd backend
npm install
```

Create your `.env` file from the example:

```bash
cp .env.example .env
```

Edit `backend/.env`:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/medicare
JWT_SECRET=any_random_secret_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```
> If using MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string instead.

**Load demo data** (creates sample doctors, patients, appointments, invoices, and login accounts):
```bash
npm run seed
```

**Start the backend server:**
```bash
npm run dev
```
The API will run at `http://localhost:5000`. Visit `http://localhost:5000` in a browser — you should see a JSON welcome message confirming it's running.

### 3. Frontend Setup

Open a **new terminal**:

```bash
cd frontend
npm install
```

Create your `.env` file:
```bash
cp .env.example .env
```
(Default already points to `http://localhost:5000/api`, so this is optional unless you change the backend port.)

**Start the frontend:**
```bash
npm run dev
```
The app will run at `http://localhost:5173`.

### 4. Login

Open `http://localhost:5173` in your browser. Click **Get Started / Login** and use one of the seeded demo accounts:

| Role         | Email                    | Password       |
|--------------|--------------------------|----------------|
| Admin        | admin@medicare.com       | admin123       |
| Doctor       | doctor@medicare.com      | doctor123      |
| Receptionist | reception@medicare.com   | reception123   |

Or click **Sign up** to create your own account.

---

## ✨ Features Included

- 🔐 JWT authentication with role-based user accounts (admin, doctor, nurse, receptionist, lab, pharmacist, accountant)
- 🧑‍🤝‍🧑 Patient registration, search, edit, delete, with photos and medical status
- 🩺 Doctor directory with departments, specializations, ratings, availability
- 📅 Appointment booking, editing, and status tracking (Pending → Confirmed → Completed / Cancelled)
- 💳 Billing & invoice generation with itemized charges, payment tracking (Paid/Partial/Pending)
- 📊 Dashboard with live stats and an appointment-status pie chart
- 🎨 Fully responsive, colorful UI built with Tailwind CSS, gradients, and real photography
- 🌱 One-command demo data seeding

## 🛠️ Tech Stack

**Frontend:** React 18, Vite, React Router, Tailwind CSS, Axios, Recharts, Lucide Icons, React Hot Toast
**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcrypt.js

## 🔧 Troubleshooting

- **"Could not load dashboard stats" / network errors** → Make sure the backend (`npm run dev` inside `/backend`) is running on port 5000 *before* you open the frontend.
- **MongoDB connection error** → Confirm MongoDB is running locally (`mongod`) or that your Atlas `MONGO_URI` and IP allowlist are correct.
- **Blank data everywhere** → Run `npm run seed` inside `/backend` once to populate demo doctors, patients, appointments and invoices.
- **Port already in use** → Change `PORT` in `backend/.env`, and update `VITE_API_URL` in `frontend/.env` to match.

## 📌 Future Enhancements (from original spec, not yet built)
Mobile app, patient self-service portal, SMS/email notifications, telemedicine, insurance integration, AI-based decision support, biometric authentication, cloud deployment, laboratory & pharmacy modules, staff attendance/leave management.

---
Built as a starter/demo implementation of the Hospital Management System specification. Extend the models/routes/pages above to add the remaining modules (Lab, Pharmacy, Staff Management, Reports).
