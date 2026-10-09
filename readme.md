# TraceX — Cybersecurity Incident Detection & Investigation Platform

**TraceX** is a MERN-stack cybersecurity platform designed to monitor API activity, detect suspicious request patterns, generate security incidents, and help investigators trace relationships between incidents, source IPs, events, and API endpoints.

The platform combines request-level telemetry with rule-based threat detection and incident-linked graph visualization to make security investigation more structured and understandable.

## Key Features

### 🔍 Real-Time API Activity Monitoring

* Captures API request metadata, including HTTP methods, endpoints, response status codes, source IPs, and timestamps.
* Records request activity through centralized Express middleware.
* Stores event data in MongoDB for investigation and analysis.

### 🛡️ Rule-Based Threat Detection

TraceX evaluates recorded API activity against configurable detection rules to identify suspicious behavior, including:

* **Brute-force attempts:** Detects repeated failed login attempts.
* **Endpoint scanning:** Identifies requests to multiple nonexistent endpoints.
* **Abnormal access:** Flags unauthorized attempts to access protected resources.
* **Excessive request frequency:** Identifies unusually high request volumes within a short time window.

When a configured rule is triggered, the detection service can create a corresponding security incident.

### 🚨 Incident Management

* Retrieves and displays detected incidents.
* Tracks incident severity and investigation status.
* Provides individual incident details and associated event timelines.
* Supports incident status updates.

### 🕸️ Attack Graph Visualization

TraceX represents incident-related activity as a graph of connected entities.

The graph can include:

* Source IP addresses
* Security incidents
* API request events
* API endpoints
* Associated users
* Sessions
* Accessed resources

Relationships such as `TRIGGERED`, `GENERATED`, `CALLED`, `ASSOCIATED WITH`, `USED`, and `ACCESSED` help investigators understand how recorded activity connects to an incident.

### 📡 Event Explorer

* Inspects events linked to incident timelines.
* Searches event metadata such as IP addresses, endpoints, HTTP methods, and status codes.
* Filters successful responses and HTTP errors.
* Navigates from an event to its associated incident when available.

### 🧪 Demo Mode

The demo workflow generates sample API traffic to exercise the configured detection rules, making it easier to test and demonstrate the platform without manually sending every request.

Detection results depend on the configured rules, request history, and authentication permissions.

## Technology Stack

| Layer             | Technologies                 |
| ----------------- | ---------------------------- |
| Frontend          | React.js, JavaScript         |
| Backend           | Node.js, Express.js          |
| Database          | MongoDB, Mongoose            |
| Authentication    | JWT-based authentication     |
| API Monitoring    | Express middleware           |
| Threat Detection  | Rule-based detection service |
| Visualization     | SVG-based attack graph       |
| Routing           | React Router                 |
| Development Tools | Git, GitHub, npm, Postman    |

## System Architecture

```text
          API Requests
               |
               v
       Express.js Server
               |
               v
      Central Event Logger
               |
               v
        MongoDB Events
               |
               v
       Detection Service
               |
       +-------+--------+
       |                |
       v                v
  No Detection     Threat Detected
                        |
                        v
                Incident Creation
                        |
             +----------+----------+
             |                     |
             v                     v
       Incident Timeline      Attack Graph
             |                     |
             +----------+----------+
                        |
                        v
                 React Dashboard
```

## Project Structure

```text
TraceX/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Incidents.jsx
│       │   ├── IncidentDetails.jsx
│       │   ├── EventExplorer.jsx
│       │   ├── DetectionEngine.jsx
│       │   └── AttackGraph.jsx
│       └── services/
│           └── api.js
│
└── backend/
    └── src/
        ├── config/
        ├── controllers/
        │   └── incidentController.js
        ├── demo/
        │   └── demoRoutes.js
        ├── middleware/
        │   ├── authMiddleware.js
        │   └── eventLogger.js
        ├── models/
        │   ├── User.js
        │   ├── Incident.js
        │   └── Event.js
        ├── routes/
        │   ├── authRoutes.js
        │   ├── userRoutes.js
        │   ├── incidentRoutes.js
        │   └── attackChainRoutes.js
        ├── services/
        │   └── detectionService.js
        └── server.js
```

*The structure above reflects the main modules; your local repository may contain additional files or different filenames.*

## Getting Started

### Prerequisites

Install the following before running TraceX:

* Node.js and npm
* MongoDB Atlas account or a local MongoDB instance
* Git

### 1. Clone the Repository

```bash
git clone https://github.com/tchandok30/TraceX.git
cd TraceX
```

### 2. Configure the Backend

Navigate to the backend directory:

```bash
cd backend
npm install
```

Create a `.env` file using the environment variable names expected by your backend configuration. For example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Ensure that your MongoDB connection and JWT configuration use the variable names expected by your existing code. Never commit real credentials or secret keys.

Start the backend using the script defined in `backend/package.json`. If your project uses Nodemon, the command may be:

```bash
npm run dev
```

The health endpoint is available at:

```text
GET http://localhost:5000/api/health
```

### 3. Configure the Frontend

Open a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Configure the frontend API base URL to point to your backend, typically:

```text
http://localhost:5000/api
```

Open the local frontend URL printed by Vite in your terminal.

### 4. Explore TraceX

1. Log in using an account configured in your application.
2. Open the dashboard.
3. Run the demo to generate sample API traffic.
4. Check the incidents created by the detection service.
5. Open the Event Explorer to inspect incident-linked events.
6. Open an incident's details or Attack Graph to explore its associated entities and relationships.

## API Overview

The following endpoints are defined by the current backend routing structure.

| Method | Endpoint                      | Purpose                                         |
| ------ | ----------------------------- | ----------------------------------------------- |
| GET    | `/api/health`                 | Check server health                             |
| `/`    | `/api/auth`                   | Authentication routes mounted under this prefix |
| `/`    | `/api/users`                  | User routes mounted under this prefix           |
| GET    | `/api/incidents`              | Retrieve incidents                              |
| GET    | `/api/incidents/:id`          | Retrieve an incident                            |
| GET    | `/api/incidents/:id/timeline` | Retrieve incident-linked events                 |
| GET    | `/api/incidents/:id/graph`    | Generate incident graph data                    |
| PATCH  | `/api/incidents/:id/status`   | Update incident status                          |
| `/`    | `/api/demo`                   | Demo routes mounted under this prefix           |
| `/`    | `/api/attack-chains`          | Attack-chain routes mounted under this prefix   |

The demo endpoint used by the frontend is:

```text
POST /api/demo/run-demo
```

Authentication requirements and available methods depend on the individual route handlers.

## Security Detection Workflow

TraceX follows a straightforward investigation workflow:

1. **Collect:** Capture API request metadata through Express middleware.
2. **Analyze:** Evaluate event data against configured detection rules.
3. **Detect:** Identify request patterns that match a rule.
4. **Record:** Create a security incident when a threat is detected.
5. **Investigate:** Review the incident and its linked event timeline.
6. **Visualize:** Explore relationships between the incident and associated entities.

## Future Enhancements

* Advanced correlation of events across users, sessions, and source IPs.
* Interactive graph controls, including zoom, pan, and relationship filtering.
* Configurable detection thresholds and rule management.
* Incident prioritization and investigation notes.
* Improved analytics for request frequency and suspicious access patterns.
* Automated testing for detection rules and incident creation.
* Expanded audit logging and security monitoring dashboards.

## Why TraceX?

Traditional application logs can be difficult to investigate when suspicious requests are scattered across endpoints and timestamps. TraceX brings request telemetry, rule-based detection, incident timelines, and relationship visualization into one investigation workflow.

The goal is to make suspicious API activity easier to identify, trace, and investigate.

## Disclaimer

TraceX is a security monitoring and educational project. Run its demo and testing workflows only in environments you own or are authorized to test. Detection accuracy depends on the implemented rules, available event data, and configuration.

---

**Built with React, Node.js, Express, and MongoDB.**
