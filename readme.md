# TraceX — Application Incident Investigation & Response Platform

> **From suspicious event to complete incident story.**

TraceX is a full-stack security investigation platform designed to help investigators understand **what happened, how it happened, and what was affected** during an application security incident.

Instead of simply displaying logs, TraceX connects application events into **incidents, timelines, investigation graphs, and impact analysis**, making it easier to reconstruct suspicious activity.

---

## 🚀 Key Features

### 🔐 Authentication & RBAC

* User registration and login
* JWT-based authentication
* Password hashing using bcrypt
* Role-based access control
* `ADMIN` and `INVESTIGATOR` roles
* Protected investigation APIs

### 📡 Application Event Collection

TraceX records application activity such as:

* API endpoint
* HTTP method
* IP address
* User
* Session
* Status code
* Timestamp
* User-Agent
* Resource information

Example:

```text
POST /api/demo/login
IP: 192.168.1.10
Status: 401
Timestamp: 10:42:15
```

---

## 🚨 Threat Detection

TraceX analyzes collected events to identify suspicious behavior.

### Currently implemented

#### Brute Force Detection

Detects repeated failed login attempts from the same IP within a time window.

```text
5+ failed login attempts
        ↓
Detection Engine
        ↓
BRUTE_FORCE
        ↓
HIGH severity incident
```

### Planned Detection Rules

* Endpoint scanning
* Abnormal administrative access
* Data burst / unusual downloads
* Multi-account attacks

---

## 🧩 Incident Management

Detected activity is converted into an **Incident** containing:

* Incident type
* Severity
* Source IP
* Start time
* End time
* Status
* Description

Incident states:

```text
OPEN
  ↓
INVESTIGATING
  ↓
RESOLVED
```

Investigators can update the status directly from the dashboard.

---

## 📊 Investigation Dashboard

The dashboard provides an overview of the security environment.

### Dashboard metrics

* Total incidents
* Open incidents
* High-severity incidents
* Incidents under investigation

Investigators can select an incident to open its complete investigation view.

---

## 🔎 Incident Investigation

Each incident contains multiple investigation views.

### Timeline

Events associated with an incident are displayed chronologically.

```text
10:40:01  POST /login     401
10:40:08  POST /login     401
10:40:14  POST /login     401
10:40:21  POST /login     401
10:40:29  POST /login     401
                    ↓
             Brute Force
```

### Investigation Graph

TraceX converts incident activity into a relationship graph:

```text
                 ┌─────────────┐
                 │   INCIDENT  │
                 └──────▲──────┘
                        │
                     TRIGGERED
                        │
                 ┌──────┴──────┐
                 │      IP     │
                 └──────┬──────┘
                        │
                    GENERATED
                        │
                 ┌──────▼──────┐
                 │    EVENT    │
                 └──────┬──────┘
                        │
                      CALLED
                        │
                 ┌──────▼──────┐
                 │     API     │
                 └─────────────┘
```

This helps investigators understand the relationship between:

* IP addresses
* Events
* APIs
* Incidents

---

## 🧪 Demo Application

TraceX includes a controlled demo application that generates application activity for investigation.

### Demo endpoints

```text
POST /api/demo/login
GET  /api/demo/users
GET  /api/demo/orders
GET  /api/demo/files
GET  /api/demo/admin/users
```

The demo application allows security scenarios to be reproduced without interacting with external systems.

---

## 🏗️ Architecture

```text
                  Demo Application
                         │
                         ▼
                ┌─────────────────┐
                │   TraceX API    │
                │ Node + Express  │
                └────────┬────────┘
                         │
                Event Collection
                         │
                         ▼
                ┌─────────────────┐
                │     MongoDB     │
                │ Events/Incidents│
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ Detection Engine│
                └────────┬────────┘
                         │
                         ▼
                    Incident
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
           Timeline     Graph    Impact Analysis
              │          │          │
              └──────────┼──────────┘
                         ▼
                React Investigation
                    Dashboard
```

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* React Router
* Axios
* React Flow

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* bcryptjs

### Planned Infrastructure

* Redis
* Socket.IO
* BullMQ
* Docker

---

## 📁 Project Structure

```text
TraceX/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   │
│   │   ├── controllers/
│   │   │   └── incidentController.js
│   │   │
│   │   ├── demo/
│   │   │   └── demoRoutes.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── eventLogger.js
│   │   │
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Event.js
│   │   │   └── Incident.js
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   └── incidentRoutes.js
│   │   │
│   │   ├── services/
│   │   │   └── detectionService.js
│   │   │
│   │   └── server.js
│   │
│   ├── package.json
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── IncidentDetails.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   └── package.json
│
└── README.md
```

---

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd TraceX
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `.env`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

Start the backend:

```bash
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

Test:

```text
GET /api/health
```

---

### 3. Frontend setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will provide the frontend URL.

---

## 🔄 How TraceX Works

A typical investigation follows this flow:

```text
1. Application receives request
             ↓
2. Event Logger records activity
             ↓
3. Event stored in MongoDB
             ↓
4. Detection Engine analyzes activity
             ↓
5. Suspicious behavior detected
             ↓
6. Incident created
             ↓
7. Related events attached to incident
             ↓
8. Investigator opens incident
             ↓
9. Timeline + Graph reveal activity
             ↓
10. Investigator updates incident status
```

---

## 🧠 Example: Brute Force Investigation

Suppose an attacker repeatedly attempts to log into the demo application.

```text
POST /login → 401
POST /login → 401
POST /login → 401
POST /login → 401
POST /login → 401
```

TraceX detects the pattern:

```text
Failed Login Events
        ↓
Same Source IP
        ↓
5+ Attempts / 5 Minutes
        ↓
Brute Force Detection
        ↓
HIGH Severity Incident
```

The investigator can then inspect:

* Source IP
* Number of events
* Exact event timeline
* API involved
* Incident graph
* Current investigation status

---

## 🗺️ Roadmap

### Phase 1 — Core Platform

* [x] Express backend
* [x] MongoDB integration
* [x] User authentication
* [x] JWT authorization
* [x] Demo application
* [x] Event collection

### Phase 2 — Detection & Investigation

* [x] Brute-force detection
* [x] Incident creation
* [x] Incident dashboard
* [x] Incident timeline
* [x] Investigation graph
* [x] Incident status management

### Phase 3 — Advanced Detection

* [ ] Endpoint scanning detection
* [ ] Abnormal access detection
* [ ] Data burst detection
* [ ] Multi-account attack detection
* [ ] Security Lab

### Phase 4 — Advanced Investigation

* [ ] IP pivot investigation
* [ ] User pivot investigation
* [ ] Blast-radius analysis
* [ ] Incident replay
* [ ] Incident DNA comparison

### Phase 5 — Real-Time Infrastructure

* [ ] Redis
* [ ] Socket.IO
* [ ] BullMQ
* [ ] Real-time incident updates
* [ ] Background detection jobs

### Phase 6 — Response

* [ ] Session revocation
* [ ] IP blocking
* [ ] Force re-authentication
* [ ] API-key disabling
* [ ] Controlled automated response

---

## 🔒 Security Considerations

TraceX is designed as a **controlled application-security investigation environment**.

* Authentication uses JWT.
* Passwords are hashed using bcrypt.
* Protected APIs require authentication.
* Security scenarios are generated against the project's own demo application.
* Secrets and database credentials are stored in environment variables.

> **Note:** TraceX is currently a development/educational project and should not be treated as a production-grade security monitoring system without additional security hardening.

---

## 🎯 Project Goal

TraceX aims to move beyond traditional application logs by transforming raw application activity into an **investigable incident story**:

```text
Raw Events
    ↓
Patterns
    ↓
Incidents
    ↓
Timeline
    ↓
Relationships
    ↓
Impact
    ↓
Investigation
    ↓
Response
```

**TraceX — From suspicious event to complete incident story.**
