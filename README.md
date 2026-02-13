#  RoadAid — Roadside Assistance Platform

A full-stack MERN application for managing roadside assistance requests with role-based access for **Clients**, **Mechanics**, and **Admins**.

---

## Setup & Installation

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure MongoDB Atlas

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster
3. Get your connection string
4. Create `backend/.env` from `.env.example`:


### 3. Run the App

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev       # uses nodemon
# or
npm start         # production
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5000](http://localhost:5000)

---

