# 🛡️ Nirikshak AI — Real-Time Microservices Proctoring System

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?logo=spring-boot&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.10-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql&logoColor=white)

## 🌟 What is Nirikshak AI?
Nirikshak AI is a state-of-the-art, privacy-first, real-time automated proctoring solution built specifically for educational institutions, EdTech platforms, and corporate placement drives. The word "Nirikshak" translates to "Observer" or "Inspector" in Hindi/Sanskrit, perfectly encapsulating our system's role: an intelligent, unbiased, and silent observer that ensures academic integrity during online assessments.

Unlike traditional proctoring solutions that rely heavily on human intervention or invasive monitoring techniques, Nirikshak AI leverages advanced Computer Vision (CV) and a resilient microservices architecture to detect anomalous behaviors (such as gaze deviation, multiple faces, or missing faces) in real-time. 

## 📸 Screenshots
> *Note: Replace the placeholder links below with actual screenshots of your running application.*
<details>
<summary><b>Click to view system screenshots</b></summary>
<br>

| Student Exam Dashboard | Admin Violation Report |
|:---:|:---:|
| <img src="https://via.placeholder.com/600x350.png?text=Student+Exam+UI" width="400"/> | <img src="https://via.placeholder.com/600x350.png?text=Violation+Report+UI" width="400"/> |

</details>

## 💡 How It Helps and Key Benefits
- **Automated Integrity Maintenance:** Eliminates the need for 1:1 human proctoring by using intelligent CV algorithms to flag suspicious activities automatically.
- **Privacy-First Approach:** We strictly adhere to a "Zero Video Storage" policy. Frames are analyzed in memory and discarded instantly. Only lightweight JSON alerts are persisted, ensuring compliance with global data privacy standards (e.g., DPDP Act, GDPR).
- **Scalable and Lightweight:** The system is designed to handle thousands of concurrent test-takers with minimal latency. It operates efficiently even on low-bandwidth networks common in remote areas.
- **Real-Time Feedback Loop:** Provides immediate visual feedback to students and instantaneous alerts to administrators, deterring malpractice before it escalates.
- **Cost-Effective:** Drastically reduces operational costs associated with hiring human proctors and storing massive amounts of video data.

## 🚀 How It Differs From Others (Competitive Advantage)
1. **Zero Video Storage Guarantee:** Competitors often record and store hours of video per student, creating massive privacy liabilities and storage costs. Nirikshak AI stores *zero* video data. 
2. **Event-Driven Microservices vs. Monoliths:** Our architecture decouples the heavy AI inference (Python/FastAPI) from the core business logic (Spring Boot), communicating via high-throughput WebSockets. This prevents system bottlenecks during peak exam loads.
3. **Edge-to-Cloud Efficiency:** Instead of sending massive video streams over the network, the React frontend extracts frames and sends lightweight Base64 payloads, reducing bandwidth consumption by over 80% compared to WebRTC streaming.
4. **Immutable Audit Trails:** Violations are stored in PostgreSQL as immutable records. The backend service layer strictly prohibits UPDATE or DELETE operations on violation logs, ensuring absolute tamper-proof auditability.

## 🛠️ Technology Stack
We have carefully selected a modern, robust, and scalable technology stack:

### Frontend
- **React 18 & Material-UI (MUI v5):** For a responsive, accessible, and highly interactive user interface featuring modern glassmorphism and a dark-first aesthetic.
- **WebSockets API:** For bidirectional, low-latency communication with the backend.

### Core Backend
- **Spring Boot 3.x (Java 17):** Provides a rock-solid, enterprise-grade foundation for business logic, JWT authentication, and WebSocket session management.
- **Spring Data JPA & Hibernate:** For robust ORM and database interactions.
- **Spring Security:** Securing endpoints and WebSockets with stateless JWT authentication.

### AI Vision Engine
- **Python 3.10 & FastAPI:** Chosen for its extremely high performance and asynchronous capabilities, making it perfect for serving AI models with minimal latency.
- **MediaPipe & OpenCV:** Utilized for lightweight, highly accurate 3D face detection, head pose estimation (solvePnP), and iris gaze tracking—all without needing heavy GPU clusters.

### Database & Infrastructure
- **PostgreSQL 15:** A powerful open-source relational database for persisting exam sessions and immutable violation records.
- **Docker & Docker Compose:** For seamless, consistent, and reproducible deployments across development, staging, and production environments.
- **Nginx:** Configured as a reverse proxy for production deployments.

## ⚙️ Environment Variables
The system requires specific environment variables to function correctly. You can define these in a `.env` file at the root of the project or pass them directly via Docker.

### Backend (`backend/`)
| Variable | Description | Default / Example |
|----------|-------------|-------------------|
| `JWT_SECRET` | Secret key for signing JWT tokens | `your_super_secret_jwt_key_here` |
| `SPRING_DATASOURCE_URL` | PostgreSQL DB connection URL | `jdbc:postgresql://localhost:5432/nirikshak` |
| `SPRING_DATASOURCE_USERNAME` | Database user | `nirikshak` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `nirikshak123` |
| `AI_VISION_SERVICE_URL` | Internal URL to Python AI service | `http://localhost:8000` |

### Python AI (`python-ai/`)
| Variable | Description | Default |
|----------|-------------|---------|
| `YAW_THRESHOLD` | Head yaw degrees before flagging `GAZE_AWAY` | `25` |
| `PITCH_THRESHOLD`| Head pitch degrees before flagging `GAZE_AWAY` | `20` |

### Frontend (`frontend/`)
| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_BACKEND_URL`| HTTP API base URL | `http://localhost:8080` |
| `REACT_APP_WS_URL` | WebSocket Server URL | `ws://localhost:8080` |

## 🚀 Installation & Quick Start

### Prerequisites
- **Docker** ≥ 24.x and **Docker Compose** ≥ 2.x
- *(For Manual Setup)*: Java 17, Maven 3.9, Node 20, Python 3.10, PostgreSQL 15

### Quick Start (Using Docker Compose)
The easiest and recommended way to get the entire microservices stack running is via Docker:

```bash
# 1. Clone or navigate to the project directory
cd "Nirikshak AI"

# 2. Start all services in detached mode
# Note: The first run takes ~5 minutes as it builds the Docker images.
docker-compose up --build -d

# 3. Access the applications:
#    Frontend (React)      → http://localhost:3000
#    Backend API (Spring)  → http://localhost:8080
#    AI Vision API (Docs)  → http://localhost:8000/docs
```

**Default Demo Credentials:**
- Email: `demo@nirikshak.ai`
- Password: `demo1234`

### Manual Setup (For Development)
If you wish to run the services individually for active development:

<details>
<summary><b>View Manual Setup Instructions</b></summary>

#### 1. Database (PostgreSQL)
```bash
docker run -d --name nirikshak-pg \
  -e POSTGRES_DB=nirikshak \
  -e POSTGRES_USER=nirikshak \
  -e POSTGRES_PASSWORD=nirikshak123 \
  -p 5432:5432 postgres:15

# Apply the initial database schema
psql -h localhost -U nirikshak -d nirikshak -f schema.sql
```

#### 2. Python AI Vision Service
```bash
cd python-ai
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 3. Spring Boot Backend
```bash
cd backend
$env:JWT_SECRET="nirikshak_jwt_secret_change_in_prod_use_256bit"
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/nirikshak"
$env:AI_VISION_SERVICE_URL="http://localhost:8000"
mvn spring-boot:run
```

#### 4. React Frontend
```bash
cd frontend
npm install
npm start
```
</details>

## 📚 API Reference Overview

Nirikshak AI exposes a clean REST API alongside its WebSockets. A full Postman collection (`nirikshak-api-collection.postman_collection.json`) is included in the root directory for easy testing.

### Authentication
- `POST /api/auth/login` - Authenticate and receive JWT
- `POST /api/auth/register` - Create a new student account

### Exam Management
- `GET /api/exam/{id}` - Fetch exam details
- `POST /api/exam/start` - Initialize a proctored exam session
- `POST /api/exam/{id}/end` - Terminate an exam session

### WebSockets (Real-Time Proctoring)
- **Endpoint:** `ws://localhost:8080/ws/exam?token=<JWT>`
- **Behavior:** Accepts Base64 encoded JPEG frames, validates them against the AI engine, and broadcasts violations back to the client immediately.

## 🔐 System Architecture & Data Flow

```text
┌──────────────────────────────────────────────────────────────────┐
│                      NIRIKSHAK AI SYSTEM                         │
│                                                                  │
│  ┌─────────────────┐   WebSocket (ws://)   ┌─────────────────┐   │
│  │  React Frontend │ ◄──────────────────── │  Spring Boot 3  │   │
│  │  (Port 3000)    │──────────────────────►│  (Port 8080)    │   │
│  └─────────────────┘                       └────────┬────────┘   │
│                                                     │            │
│                                              HTTP POST /analyze  │
│                                                     │            │
│                                            ┌────────▼────────┐   │
│                                            │ Python FastAPI  │   │
│                                            │ (Port 8000)     │   │
│                                            └─────────────────┘   │
│                                                                  │
│  ┌─────────────────┐                                             │
│  │   PostgreSQL 15 │ ◄── Spring Boot writes (violations are      │
│  │   (Port 5432)   │     IMMUTABLE once written)                 │
│  └─────────────────┘                                             │
└──────────────────────────────────────────────────────────────────┘
```

## 🧪 Testing
The project includes automated tests to ensure system stability.
- **Backend (Spring Boot):** Run `mvn test` inside the `backend/` directory to execute JUnit 5 tests.
- **Frontend (React):** Run `npm test` inside the `frontend/` directory to run React Testing Library suites.

## ❓ Troubleshooting & FAQ
- **Camera Not Found / Permission Denied:** Ensure your browser has granted camera permissions. Note: Browsers strictly require `HTTPS` (or `localhost`) to access `getUserMedia`.
- **Port Conflicts:** If ports `8080`, `3000`, or `8000` are already in use, stop existing processes or map different external ports in `docker-compose.yml`.
- **Database Connection Refused:** Ensure PostgreSQL is fully started before the backend attempts to connect. The Docker Compose file utilizes `depends_on` to handle this sequence automatically.

## 🤝 Contributing
Contributions are always welcome! 
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
MIT — Build freely, proctor fairly.
*Built with ❤️ for the global EdTech ecosystem.*
