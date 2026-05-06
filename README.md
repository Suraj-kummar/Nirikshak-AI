# 🛡️ Nirikshak AI — Real-Time Microservices Proctoring System

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?logo=spring-boot&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.10-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

---

## 🌟 What is Nirikshak AI?

Nirikshak AI is a state-of-the-art, **privacy-first**, real-time automated proctoring solution built for educational institutions, EdTech platforms, and corporate placement drives. The word **"Nirikshak"** translates to *"Observer"* or *"Inspector"* in Hindi/Sanskrit — an intelligent, unbiased, and silent observer that ensures academic integrity during online assessments.

Unlike traditional proctoring solutions that rely on human intervention or invasive video storage, Nirikshak AI uses **Computer Vision** and a **resilient microservices architecture** to detect anomalous behaviors (gaze deviation, multiple faces, missing face) in real-time — storing **zero video data**.

---

## 💡 Key Benefits

- ✅ **Zero Video Storage** — Frames are analyzed in memory and discarded instantly. Only JSON alerts are persisted.
- ✅ **Real-Time Detection** — WebSocket-driven, sub-300ms frame analysis pipeline.
- ✅ **Immutable Audit Trails** — Violation records cannot be deleted or modified once written.
- ✅ **Privacy-First** — Compliant with DPDP Act, GDPR principles.
- ✅ **Fully Dockerized** — Runs anywhere Docker is installed, no manual setup required.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Material-UI v5, WebSockets |
| **Backend** | Spring Boot 3.x, Spring Security, JWT, Flyway |
| **AI Vision** | Python 3.10, FastAPI, MediaPipe, OpenCV |
| **Database** | PostgreSQL 15 |
| **Infrastructure** | Docker, Docker Compose, Nginx |

---

## 🚀 Installation & Quick Start

### ✅ Option 1 — Docker Compose (Recommended, easiest)

> **Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/nirikshak-ai.git
cd nirikshak-ai

# 2. Start all 4 services (first run takes ~5-10 min to build images)
docker-compose up --build

# 3. Open in your browser
#    Frontend  →  http://localhost:3000
#    API Docs  →  http://localhost:8000/docs
#    Backend   →  http://localhost:8080
```

**Demo Login Credentials:**
| Field | Value |
|---|---|
| Email | `demo@nirikshak.ai` |
| Password | `demo1234` |

> To stop: `docker-compose down`  
> To restart (no rebuild): `docker-compose up`

---

### ✅ Option 2 — Manual Setup (For Development)

Use this if you want to run each service individually for active development.

<details>
<summary><b>📖 Click to expand manual setup instructions</b></summary>

#### Prerequisites
- Java 21 + Maven 3.9
- Node.js 20
- Python 3.10
- PostgreSQL 15

#### Step 1 — Database
```bash
# Start PostgreSQL via Docker (easiest)
docker run -d --name nirikshak-pg \
  -e POSTGRES_DB=nirikshak \
  -e POSTGRES_USER=nirikshak \
  -e POSTGRES_PASSWORD=nirikshak123 \
  -p 5432:5432 postgres:15
```

#### Step 2 — Python AI Vision Service
```bash
cd python-ai
python -m venv .venv

# Activate virtual environment
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac

pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Service available at: http://localhost:8000

#### Step 3 — Spring Boot Backend
```bash
cd backend

# Windows (PowerShell)
$env:JWT_SECRET="nirikshak_jwt_secret_change_in_prod_use_256bit"
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/nirikshak"
$env:SPRING_DATASOURCE_USERNAME="nirikshak"
$env:SPRING_DATASOURCE_PASSWORD="nirikshak123"
$env:AI_VISION_SERVICE_URL="http://localhost:8000"

mvn spring-boot:run
```
API available at: http://localhost:8080

#### Step 4 — React Frontend
```bash
cd frontend
npm install
npm start
```
App available at: http://localhost:3000

</details>

---

### ✅ Option 3 — Share with Anyone (Cloud Deploy)

Deploy Nirikshak AI to the internet so anyone can access it without installing anything.

| Service | Platform | Free? |
|---|---|---|
| React Frontend | **Vercel** | ✅ |
| Spring Boot API | **Render** | ✅ |
| Python AI | **Render** | ✅ |
| PostgreSQL DB | **Render** | ✅ (90 days) |

<details>
<summary><b>☁️ Click to expand cloud deployment steps</b></summary>

#### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/nirikshak-ai.git
git push -u origin main
```

#### Step 2 — Deploy on Render (backend)
1. Go to [render.com](https://render.com) → New → **PostgreSQL** (free)
2. New → **Web Service** → Docker → root: `python-ai`
3. New → **Web Service** → Docker → root: `backend`
   - Add env vars: `SPRING_DATASOURCE_URL`, `JWT_SECRET`, `AI_VISION_SERVICE_URL`

#### Step 3 — Deploy on Vercel (frontend)
1. Go to [vercel.com](https://vercel.com) → New Project → Import GitHub repo
2. Root Directory: `frontend`
3. Add env var: `REACT_APP_BACKEND_URL` = your Render Spring Boot URL
4. Deploy 🚀

> Full details in [`DEPLOY.md`](./DEPLOY.md)

</details>

---

## ⚙️ Environment Variables

### Backend
| Variable | Description | Default |
|---|---|---|
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `nirikshak_jwt_secret...` |
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC URL | `jdbc:postgresql://localhost:5432/nirikshak` |
| `SPRING_DATASOURCE_USERNAME` | DB username | `nirikshak` |
| `SPRING_DATASOURCE_PASSWORD` | DB password | `nirikshak123` |
| `AI_VISION_SERVICE_URL` | Python AI service URL | `http://localhost:8000` |

### Frontend
| Variable | Description | Default |
|---|---|---|
| `REACT_APP_BACKEND_URL` | Backend API base URL | `http://localhost:8080` |
| `REACT_APP_WS_URL` | WebSocket URL | `ws://localhost:8080` |

---

## 📚 API Reference

Full Postman collection included: `nirikshak-api-collection.postman_collection.json`

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login and receive JWT |
| `POST` | `/api/auth/register` | Register new student |

### Exam Management
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/exam/start` | Start a proctored session |
| `GET` | `/api/exam/{id}` | Get session details |
| `POST` | `/api/exam/{id}/end` | End session |
| `POST` | `/api/exam/{id}/submit` | Submit answers |
| `GET` | `/api/exam/questions/{examId}` | Get question bank |

### Violations
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/violations/{sessionId}` | Get violation report |

### WebSocket (Real-Time Proctoring)
```
ws://localhost:8080/ws/exam?token=<JWT>
```
Accepts Base64-encoded JPEG frames → returns violation alerts in real-time.

---

## 🔐 System Architecture

```
Browser → React (Port 3000)
              │  WebSocket + REST
              ▼
        Spring Boot (Port 8080)
         │                 │
         │ Flyway           │ HTTP POST /analyze
         ▼                 ▼
   PostgreSQL 15     Python FastAPI (Port 8000)
   (Violations,      (MediaPipe CV — gaze,
    Sessions,         face detection)
    Questions)
```

---

## 🧪 Running Tests

```bash
# Backend unit tests (JUnit 5 + MockMvc)
cd backend
mvn test

# Python AI tests (pytest)
cd python-ai
pip install -r requirements-test.txt
pytest
```

---

## ❓ Troubleshooting

| Issue | Fix |
|---|---|
| Camera not working | Allow camera in browser permissions. Needs `https://` or `localhost`. |
| Port already in use | `docker-compose down` then `docker-compose up` |
| Spring Boot fails to start | Wait for PostgreSQL to be healthy first |
| First request is slow | Free tier on Render sleeps after 15 min — first request wakes it up (~30s) |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT — Build freely, proctor fairly.

---

<div align="center">

## ✨ Made with ❤️ by Surajj

*Building intelligent systems that make education fair for everyone.*

[![GitHub](https://img.shields.io/badge/GitHub-Surajj-181717?logo=github&logoColor=white)](https://github.com/Suraj-kummar)

</div>
