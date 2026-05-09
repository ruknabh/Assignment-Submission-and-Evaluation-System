# ASES — Assignment Evaluation System

A full-stack Assignment Evaluation System built using:

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Database Containerization: Docker
- Authentication: JWT
- Architecture: REST API based modular architecture

---

# Project Structure

```txt
ases/
│
├── client/                            # React Frontend
│   │
│   ├── public/
│   │
│   ├── src/
│   │   │
│   │   ├── api/                       # Axios instances & API handlers
│   │   ├── components/                # Reusable UI components
│   │   ├── context/                   # React Context API
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── layouts/                   # Layout wrappers
│   │   ├── pages/                     # Application pages
│   │   ├── routes/                    # Route management
│   │   ├── styles/                    # Global styling
│   │   ├── utils/                     # Utility/helper functions
│   │   │
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── .env
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── README.md
│   └── vite.config.js
│
│
├── server/                            # Express Backend
│   │
│   ├── src/
│   │   │
│   │   ├── config/
│   │   │   ├── db.js                  # PostgreSQL connection pool
│   │   │   └── initDb.js              # Initialize database schema
│   │   │
│   │   ├── controllers/
│   │   │   └── auth.controller.js     # Register, login, getMe logic
│   │   │
│   │   ├── middleware/
│   │   │   ├── authenticate.js        # Verify JWT, attach req.user
│   │   │   ├── errorHandler.js        # Global error handler
│   │   │   └── requireRole.js         # Role-based access control (RBAC)
│   │   │
│   │   ├── queries/
│   │   │   ├── schema.sql             # Database schema & table definitions
│   │   │   └── auth.queries.js        # SQL queries for auth operations
│   │   │
│   │   ├── routes/
│   │   │   └── auth.routes.js         # Auth endpoints (register, login, me)
│   │   │
│   │   ├── services/                  # Business logic layer
│   │   │
│   │   ├── utils/
│   │   │   ├── ApiError.js            # Custom error class with status code
│   │   │   └── asyncHandler.js        # Async wrapper, eliminates try/catch
│   │   │
│   │   └── validators/
│   │       └── auth.validator.js      # Zod schemas for register & login
│   │
│   ├── uploads/
│   │   └── submissions/               # Uploaded assignment files
│   │
│   ├── .env
│   ├── .gitignore
│   ├── app.js                         # Express app, middleware & route mounting
│   ├── index.js                       # Server entry point, DB connect & listen
│   ├── package.json
│   └── package-lock.json
│
│
├── .env
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

# Tech Stack

## Frontend
- React
- Vite
- React Router DOM
- Axios

## Backend
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- Multer
- Zod / Express Validator

## Database
- PostgreSQL
- Docker Container

---

# Current Setup Status

## Completed
- Project structure setup
- Docker PostgreSQL container setup
- PostgreSQL database connection
- Express backend setup
- ES Modules configuration
- Environment variable configuration

## Upcoming
- Database schema design
- Authentication system
- RBAC implementation
- Course management
- Assignment management
- Submission system
- Evaluation & grading
- Frontend integration

---

# Development Architecture

```txt
React Frontend
        ↓
Express Backend
        ↓
PostgreSQL Database
        ↓
Docker Container
```

---

# Environment Variables

## Server `.env`

```env
PORT=5000

DB_USER=ases_user
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ases_db

JWT_SECRET=mysecretkey
```

---

# Docker PostgreSQL Container

## Create PostgreSQL Container

```bash
docker run --name ases_postgres_db \
-e POSTGRES_USER=ases_user \
-e POSTGRES_PASSWORD= \
-e POSTGRES_DB=ases_db \
-p 5432:5432 \
-v ases_postgres_data:/var/lib/postgresql/data \
-d postgres:16
```

## Start Container

```bash
docker start ases_postgres_db
```

## Stop Container

```bash
docker stop ases_postgres_db
```

## Open PostgreSQL Shell

```bash
docker exec -it ases_postgres_db psql -U ases_user -d ases_db
```

---

# Run Backend

```bash
cd server
npm run dev
```

---

# Run Frontend

```bash
cd client
npm run dev
```

---

# Future Improvements

- Root level concurrent scripts
- Full authentication system
- File upload management
- Analytics dashboard
- Plagiarism detection
- Deployment setup
- CI/CD pipeline
- Dockerized backend/frontend