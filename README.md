# MediCloud EHR System

## Project Overview

MediCloud is a cloud-native Electronic Health Record (EHR) system designed for hospital patient management. It demonstrates full-stack development principles, secure cloud deployment, and data persistence using a NoSQL database.

**The application allows medical staff to:**

* **Admit new patients (Create).**

* **View a real-time dashboard of patient status and ward capacity (Read).**

* **Update patient medical details, clinical notes, and department transfers (Update).**

* **Discharge or remove patient records (Delete).**

* **Filter data by hospital department (Emergency, ICU, Pediatrics, etc.).**

## Technology Stack

* **Runtime: Node.js (v20 LTS)**

* **Framework: Express.js (v4.19)**

* **Database: MongoDB Atlas (Mongoose v8 ODM)**

* **Frontend: EJS Templating + Bootstrap 5.3 + Bootstrap Icons**

* **Deployment: Render (PaaS) with CI/CD via GitHub**

## Local Development Setup

Follow these steps to run the application on your local machine.

### 1. Prerequisites

Ensure you have the following installed:

* **Node.js (v18 or higher)**

* **Git**

* **A package manager (npm comes with Node, or you can use pnpm)**

### 2. Clone the Repository

Open your terminal or command prompt and run:

#### Clone the repository

```bash
git clone https://github.com/jayzsec/ehr-mvp.git
```

#### Navigate into the project directory

```bash
cd ehr-mvp
```

### 3. Install Dependencies

You can use npm (standard) or pnpm (faster) to install the required libraries defined in package.json.

Using npm:
```bash
npm install
```

Using pnpm:

```bash
# If you don't have pnpm installed yet:
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 4. Configure Environment Variables

Security Best Practice: Never commit credentials to Git.

* Create a new file in the root directory named .env.

* Add your specific MongoDB Atlas credentials:

```bash
PORT=3000
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@cluster0.mongodb.net/medicloud?retryWrites=true&w=majority
```

### 5. Run the Application

Start the local development server:

Using npm:

```bash
npm start
# OR for development with auto-restart:
npm run dev
```

Using pnpm:

```bash
pnpm start
# OR
pnpm dev
```

The application will be accessible at http://localhost:3000.

## Cloud Deployment (Render.com)

This project is configured for ***Continuous Deployment***. Any push to the `main` branch on GitHub will trigger a new build on Render.

### Create Service:

* **Log in to Render dashboard.**

* Select **New + > Web Service.**

* Connect your GitHub repository.

### Configure Build Settings:

* **Runtime:** Node

* **Build Command: `npm install` (or `pnpm install`)**

* **Start Command: `node server.js`**

### Set Environment Variables (Crucial):

* Scroll to the "Environment Variables" section in Render.

* **Add Key:** `MONGODB_URI`

* Value: ***(Paste your actual connection string from MongoDB Atlas).***

Note: Render automatically provides the PORT variable.

### Deploy:

* Click **Create Web Service**.

* Wait for the "Live" badge. Your SaaS EHR is now online.

## Architecture & Key Components

### The Server (server.js)

This is the entry point of the application. It follows the **MVC (Model-View-Controller)** pattern, condensed for this assessment.

* **Database Connection:** Uses `mongoose` to maintain a persistent connection pool to MongoDB Atlas.

* **Middleware:** `express.urlencoded` parses incoming POST request bodies (form submissions).

* **Routing:** Handles HTTP verbs (GET, POST) to perform CRUD operations.

### The Model (Schema)

The `patientSchema` defines the data structure. It enforces data integrity (e.g., ensuring a patient has a name and valid age) before saving to the cloud.

**The View (`/views`)**

* **EJS:** Renders HTML on the server side, injecting dynamic data (patient lists, analytics) before sending it to the browser.

* **Filtering Logic:** The dashboard supports filtering by department using query parameters (e.g., `/?department=ICU`).

### Security Measures

**Environment Variables:** Sensitive credentials (database passwords) are stored in `.env` locally and injected via the Cloud Provider's secure dashboard in production.

**Input Validation:** Mongoose schemas prevent invalid data types from corrupting the database.

**HTTPS:** Render provides automatic SSL/TLS certificates for secure data transmission.