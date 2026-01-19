# Activity Aggregation System

A full-stack development application for aggregating and analyzing activity data with dynamic grouping, server-side pagination, and caching.

> **Note:** This is a local development application for demonstration purposes.

## 📸 Screenshots

### Main Dashboard
![Dashboard](./screenshots/dashboard.png)

### Data Aggregation with Dynamic Grouping
![Data Table](./screenshots/data-table.png)

---

## 🚀 Tech Stack

**Frontend:**
- Angular 21 (Zoneless + Signals)
- Angular Material UI
- TypeScript
- RxJS
- SCSS with BEM methodology

**Backend:**
- Spring Boot 3.x
- Java 21
- PostgreSQL 15+
- Caffeine Cache
- Hibernate/JPA
- Lombok

---

## 📋 Prerequisites

Before running this application, ensure you have:

- **Node.js** 20+ and npm
- **Java** 21+
- **PostgreSQL** 15+
- **Maven** 3.9+ (or use included `mvnw`)
- **Git**

---

## 🗄️ Database Setup

### 1. Install PostgreSQL

If you don't have PostgreSQL installed:
- **Windows:** Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **Mac:** `brew install postgresql`
- **Linux:** `sudo apt-get install postgresql`

### 2. Create Database

Connect to PostgreSQL and create the database:

```sql
-- Connect to PostgreSQL (default user: postgres)
psql -U postgres

-- Create database
CREATE DATABASE activity_db;

-- (Optional) Create dedicated user
CREATE USER activity_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE activity_db TO activity_user;

-- Exit psql
\q
```

### 3. Database Schema

The following tables are **auto-created by JPA/Hibernate** on first run:

#### **activity** table
| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Primary key (auto-generated) |
| `project_id` | BIGINT | Foreign key to project |
| `employee_id` | BIGINT | Foreign key to employee |
| `date` | DATE | Activity date |
| `hours` | INTEGER | Hours worked |

#### **project** table
| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Primary key |
| `name` | VARCHAR | Project name |

#### **employee** table
| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Primary key |
| `name` | VARCHAR | Employee name |

**Indexes:**
- Composite index on `(project_id, employee_id, date)` for optimized aggregation queries

---

## 🔧 Backend Setup & Run

### 1. Navigate to Backend Directory
```bash
cd activity-aggregation-be
```

### 2. Configure Database Connection

Edit `src/main/resources/application.properties`:

```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/activity_db
spring.datasource.username=postgres
spring.datasource.password=123

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# Data Seeding Configuration
# Use 'true' for demo data (5-10 rows) - fast for development
# Use 'false' for 100k rows - for performance/pagination testing
app.seed.use-demo=true

# Only used when use-demo=false
app.seed.total-rows=100000
```

### 3. Run the Application

```bash
# Using Maven wrapper (recommended)
./mvnw spring-boot:run

# OR using Maven directly
mvn spring-boot:run

# OR build and run JAR
./mvnw clean package
java -jar target/*.jar
```

**Backend will be available at:** `http://localhost:8080`

### 4. Verify Backend is Running

Open in browser or use curl:
```bash
curl http://localhost:8080/api/activities/aggregate?page=0&size=10
```

---

## 🎨 Frontend Setup & Run

### 1. Navigate to Frontend Directory
```bash
cd activity-aggregation-fe
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm start
```

**Frontend will be available at:** `http://localhost:4200`

The browser will automatically open. If not, navigate to `http://localhost:4200`.

---

## 🔄 Data Seeding Options

The application automatically seeds data on first run if the database is empty.

### Demo Data (Quick Testing)
```properties
app.seed.use-demo=true
```
- Seeds 5-10 sample records
- Instant loading
- Good for development

### Performance Testing Data
```properties
app.seed.use-demo=false
app.seed.total-rows=100000
```
- Seeds 100,000 records
- Takes ~30 seconds
- Tests pagination and performance

### Re-seeding Data

If you want to change from demo to full data (or vice versa):

1. **Drop and recreate the database:**
   ```sql
   DROP DATABASE activity_db;
   CREATE DATABASE activity_db;
   ```

2. **Update `application.properties`** with desired seeding config

3. **Restart the backend** - data will be re-seeded automatically

---

## 📦 Project Structure

```
activity-aggregation/
├── activity-aggregation-be/       # Spring Boot Backend
│   ├── src/main/
│   │   ├── java/.../api/
│   │   │   ├── controller/        # REST endpoints
│   │   │   ├── service/           # Business logic
│   │   │   ├── repository/        # Data access
│   │   │   └── model/             # JPA entities
│   │   └── resources/
│   │       └── application.properties
│   └── pom.xml
│
└── activity-aggregation-fe/       # Angular Frontend
    ├── src/app/activity-aggregation/
    │   ├── components/             # UI components
    │   ├── services/               # API & state management
    │   └── models/                 # TypeScript interfaces
    └── package.json
```

---

## 🔗 API Endpoint

```
GET /api/activities/aggregate?groupBy={field}&page={n}&size={n}
```

**Parameters:**
- `groupBy`: `project`, `employee`, `date` (can use multiple)
- `page`: Page number (default: 0)
- `size`: Page size (default: 25)

**Example:**
```
/api/activities/aggregate?groupBy=project&groupBy=employee&page=0&size=25
```

---

## 🧪 Tests

```bash
# Backend
cd activity-aggregation-be && ./mvnw test

# Frontend  
cd activity-aggregation-fe && npm test
```

---

## 🎯 Key Features

- ✅ **Dynamic data grouping** - Group by Project, Employee, Date or combinations
- ✅ **Server-side pagination** - Handles 100k+ records efficiently
- ✅ **Database aggregation** - SQL GROUP BY for performance
- ✅ **Caching** - 5-minute TTL on both frontend and backend
- ✅ **Angular 21 Signals** - Zoneless, modern reactive state management
- ✅ **Material Design** - Clean, professional UI
- ✅ **Auto data seeding** - Demo (10 rows) or full (100k rows)

---

## ⚙️ Configuration

**Key Settings** (`application.properties`):

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/activity_db
spring.datasource.username=postgres
spring.datasource.password=123

# Data Seeding
app.seed.use-demo=true    # true = 10 rows, false = 100k rows
```

**Frontend** (`environment.ts`):
```typescript
apiBaseUrl: 'http://localhost:8080'
```

---

## 🔧 Troubleshooting

### Backend Issues

**Problem:** "Failed to connect to database"
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Check database exists
psql -U postgres -l
```

**Problem:** "Port 8080 already in use"
```bash
# Find and kill process using port 8080
lsof -ti:8080 | xargs kill -9
```

**Problem:** "Data not seeding"
```bash
# The app only seeds if database is empty
# Drop and recreate database:
psql -U postgres -c "DROP DATABASE activity_db;"
psql -U postgres -c "CREATE DATABASE activity_db;"
```

### Frontend Issues

**Problem:** "Cannot GET /api/activities/aggregate"
- Make sure backend is running on port 8080
- Check `proxy.conf.json` is configured correctly

**Problem:** "CORS error"
- Backend CORS is configured for `http://localhost:4200`
- Make sure both frontend and backend are running

---

## 💡 Quick Tips

**Check database records:**
```sql
SELECT COUNT(*) FROM activity;
```

**Clear and re-seed data:**
```sql
DROP DATABASE activity_db;
CREATE DATABASE activity_db;
# Then restart backend
```

Both frontend and backend have hot reload enabled by default.

---


