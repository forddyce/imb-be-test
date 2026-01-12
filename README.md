# FCM Notification Service

A Firebase Cloud Messaging (FCM) notification service with RabbitMQ integration. This service consumes messages from a RabbitMQ queue, sends notifications via FCM, stores delivery records in MySQL, and publishes results to a RabbitMQ topic.

## 🚀 Quick Start (5 Minutes)

### Prerequisites

- Node.js 18+ and npm
- Docker (for MySQL and RabbitMQ)
- Firebase account with FCM enabled

### Step 1: Firebase Setup (⚠️ IMPORTANT - Do This First)

**You MUST create your own Firebase service account credentials:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing project
3. Enable Cloud Messaging: Project Settings → Cloud Messaging
4. **Generate service account key:**
    - Go to Project Settings → Service Accounts
    - Click "Generate New Private Key"
    - **IMPORTANT:** Save the JSON file as `firebase-service-account.json` in the project root
    - **⚠️ SECURITY:** Never commit this file to Git or share it publicly!

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Start Dependencies (MySQL & RabbitMQ)

```bash
# One command to start all services
docker-compose up -d

# Wait 10-15 seconds for services to initialize
sleep 15

# Verify services are running
docker-compose ps
```

**Useful Docker Commands:**

- **Restart services:** `docker-compose restart`
- **Stop services:** `docker-compose down`
- **View logs:** `docker-compose logs -f`

### Step 4: Configure Environment

The🧪 Testing the Service

### Get a Device Token

You need a valid FCM device token to receive notifications:

1. **Start the token generator:**

    ```bash
    # In a new terminal
    python3 -m http.server 8080
    ```

2. **Open in browser:** http://localhost:8080/get-token.html

3. **Click "Request Notification Permission"** and allow notifications

4. **Copy the token** that appears

### Send a Test Notification

1. **Edit the test script:**

    ```bash
    nano scripts/test-publisher.js
    ```

    Replace `YOUR_DEVICE_TOKEN_HERE` with your actual token

2. **Send the message:**

    ```bash
    node scripts/test-publisher.js
    ```

3. **Check the notification** appears in your browser!

### Monitor Results

In a new terminal, run:

```bash
node scripts/test-subscriber.js
```

This shows all successfully delivered notifications.

---

4. **Start all services:**

    ```bash
    docker-compose up -d
    ```

5. **Check service status:**

    ```bash
    docker-compose ps
    docker-compose logs -f app
    ```

6. **Access services:**
    - Application: http://localhost:3000/health
    - RabbitMQ Management: http://localhost:15672 (guest/guest)
    - MySQL: localhost:3306

### Local Development Setup

1. **Install dependencies:**

    ```bash
    npm install
    ```

2. **Set up MySQL:**

    ```bash
    # Create database
    mysql -u root -p
    CREATE DATABASE fcm_notifications;
    ```

3. **Set up RabbitMQ:**

    ```bash
    # Using Docker
    docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.12-management-alpine
    ```

4. **Configure environment:**

    ```bash
    cp .env.example .env
    ```

    Edit `.env` and set:
    - `FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json`
    - Update MySQL credentials
    - Update RabbitMQ URL if needed

5. **Place Firebase credentials:**
    - Put your `firebase-service-account.json` in the project root

6. **Build and run:**

    ```bash
    # Development mode with auto-reload
    npm run dev

    # Production build
    npm run build
    npm start
    ```

## Configuration

All configuration is done via environment variables. See [.env.example](.env.example) for all available options.

### Key Configuration Variables

| Variable                        | Description                    | Default |
| ------------------------------- | ------------------------------ | ------- |
| `PORT`                          | HTTP server port               | 3000    |
| `FIREBASE_PROJECT_ID`           | Firebase project ID            | -       |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to service account JSON   | -       |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Service account as JSON string | -       |

| `📋 API Reference
"identifier": "fcm-msg-a1beff5ac",
"deliverAt": "2026-01-31T12:34:56Z"
}

````

## API Endpoints

### Health Check

```bash
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2026-01-12T10:30:00Z",
  "uptime": 123.456,
  "services": {
    "rabbitmq": true,
    "firebase": true
  }
}
````

### Get All Jobs

```bash
GET /api/jobs?limit=100

Response:
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "identifier": "fcm-msg-a1beff5ac",
      "deliverAt": "2026-01-31T12:34:56",
      "createdAt": "2026-01-31T12:34:56"
    }
  ]
}
```

### Get Specific Job

```bash
GET /api/jobs/:identifier

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "identifier": "fcm-msg-a1beff5ac",
    "deliverAt": "2026-01-31T12:34:56",
    "createdAt": "2026-01-31T12:34:56"
  }
}
```

## Testing the Application

### Quick Start Testing

#### Step 1: Start Dependencies (MySQL & RabbitMQ)

Run MySQL and RabbitMQ using Docker:

```bash
docker run -d --name fcm-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=fcm_notifications \
  -p 3306:3306 \
  mysql:8.0

docker run -d --name fcm-rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3.12-management-alpine
```

**Or use Docker Compose** (starts everything including the app):

```bash
docker-compose up -d mysql rabbitmq
# Wait 10-15 seconds for services to be ready
```

#### Step 2: Verify Dependencies are Running

```bash
# Check MySQL
docker exec -it fcm-mysql mysqladmin ping -h localhost -u root -ppassword

# Check RabbitMQ
curl http://localhost:15672/api/health/checks/alarms -u guest:guest
```

#### Step 3: Build and Start the Application

```bash
# Build TypeScript
npm run build

# Start the service
npm start

# OR for development with hot reload:
npm run dev
```

#### Step 4: Verify Application is Running

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
    "status": "ok",
    "timestamp": "2026-01-12T...",
    "uptime": 1.234,
    "services": {
        "rabbitmq": true,
        "firebase": true
    }
}
```

#### Step 5: Get a Test Device Token

You need a valid FCM device token. Options:

**Option 1: Web VAPID Token (Easiest)**
Create a simple HTML file to get a token:

```html
<!DOCTYPE html>
<html>
    <head>
        <title>FCM Token Generator</title>
    </head>
    <body>
        <h1>FCM Token Generator</h1>
        <button id="requestPermission">Request Notification Permission</button>
        <p id="token"></p>

        <script type="module">
            import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
            import {
                getMessaging,
                getToken,
            } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js';

            const firebaseConfig = {
                apiKey: 'AIzaSyDTImCyuxrnbIYyL7EdHDRO3VYeH-6-Z54',
                authDomain: 'my--projects-cc848.firebaseapp.com',
                projectId: 'my--projects-cc848',
                storageSenderId: '373404275976',
                appId: '1:373404275976:web:6ffdc687213eea6fb8c8bd',
            };

            const app = initializeApp(firebaseConfig);
            const messaging = getMessaging(app);

            document.getElementById('requestPermission').addEventListener('click', async () => {
                try {
                    const token = await getToken(messaging, {
                        vapidKey:
                            'BAdL9mPstBTS2WDU57N6ghcuKQfdLpi6e6gQAR4Tr7NW9zDLcmkd_CUOS3uM9Kh343fGXFYbrb4XXS2c3_cot14',
                    });
                    console.log('Token:', token);
                    document.getElementById('token').textContent = 'Token: ' + token;
                } catch (err) {
                    console.error('Error:', err);
                }
            });
        </script>
    </body>
</html>
```

Save as `get-token.html` and open in browser (needs to be served via HTTP/HTTPS, like `python3 -m http.server 8080`).

**Option 2: Use a Mobile App**

- Build an Android/iOS app with FCM
- Get the registration token from the app

**Option 3: For Quick Testing (might not deliver)**
Use a dummy token format: `test-device-token-123456` (Firebase will reject it, but you can test the flow)

#### Step 6: Publish Test Message to RabbitMQ

**Method 1: Using the provided test script**

Edit `scripts/test-publisher.js` and replace `YOUR_DEVICE_TOKEN_HERE` with your actual device token:

```javascript
deviceId: 'YOUR_ACTUAL_DEVICE_TOKEN',
```

Then run:

```bash
node scripts/test-publisher.js
```

**Method 2: Using RabbitMQ Management UI**

1. Open http://localhost:15672 (login: guest/guest)
2. Go to "Queues" tab
3. Click on `notification.fcm`
4. Expand "Publish message"
5. Set "Delivery mode" to "2 - Persistent"
6. In "Payload" field, paste:

```json
{
    "identifier": "test-msg-001",
    "type": "device",
    "deviceId": "YOUR_DEVICE_TOKEN_HERE",
    "text": "Hello! This is a test notification from FCM service"
}
```

7. Click "Publish message"

**Method 3: Using Node.js directly**

```javascript
const amqp = require('amqplib');

async function publishMessage() {
    const conn = await amqp.connect('amqp://localhost:5672');
    const channel = await conn.createChannel();
    await channel.assertQueue('notification.fcm', { durable: true });

    const message = {
        identifier: `test-${Date.now()}`,
        type: 'device',
        deviceId: 'YOUR_DEVICE_TOKEN_HERE',
        text: 'Test notification!',
    };

    channel.sendToQueue('notification.fcm', Buffer.from(JSON.stringify(message)), {
        persistent: true,
    });

    console.log('Message sent!');
    setTimeout(() => process.exit(0), 500);
}

publishMessage();
```

#### Step 7: Monitor Results

**Check application logs:**

```bash
# If running with npm start
# Logs appear in console

# Check log files
tail -f logs/combined.log
tail -f logs/error.log
```

**Subscribe to results topic:**

```bash
node scripts/test-subscriber.js
```

This will show all messages published to `notification.done` topic after successful delivery.

**Check database:**

```bash
docker exec -it fcm-mysql mysql -uroot -ppassword fcm_notifications -e "SELECT * FROM fcm_job ORDER BY createdAt DESC LIMIT 5;"

# Or via MySQL client
mysql -h localhost -u root -ppassword fcm_notifications
SELECT * FROM fcm_job ORDER BY createdAt DESC LIMIT 10;
```

**Check via API:**

```bash
# Get all jobs
curl http://localhost:3000/api/jobs

# Get specific job
curl http://localhost:3000/api/jobs/test-msg-001
```

#### Step 8: Verify Notification Received

- If using a mobile device, check for the notification
- If using web, check browser notifications
- Check Firebase Console > Cloud Messaging for delivery stats

#### Publish Test Messages (Alternative Methods)

**Using the test script:**

```bash
# Edit scripts/test-publisher.js and add your device token
node scripts/test-publisher.js
```

**Using RabbitMQ Management UI:**

1. Open http://localhost:15672
2. Login with guest/guest
3. Go to Queues → notification.fcm
4. Publish message:

```json
{
    "identifier": "test-msg-123",
    "type": "device",
    "deviceId": "YOUR_DEVICE_TOKEN",
    "text": "Hello from test!"
}
```

**Using Node.js script:**

```javascript
const amqp = require('amqplib');

async function send() {
    const conn = await amqp.connect('amqp://localhost:5672');
    const channel = await conn.createChannel();
    await channel.assertQueue('notification.fcm', { durable: true });

    channel.sendToQueue(
        'notification.fcm',
        Buffer.from(
            JSON.stringify({
                identifier: `test-${Date.now()}`,
                type: 'device',
                deviceId: 'YOUR_DEVICE_TOKEN',
                text: 'Test notification',
            })
        ),
        { persistent: true }
    );

    console.log('Message sent!');
    await channel.close();
    await conn.close();
}

send();
```

#### Subscribe to Results

**Using the test script:**

```bash
node scripts/test-subscriber.js
```

This will listen for messages published to the `notification.done` topic.

#### Monitor Logs

```bash
# Docker
docker-compose logs -f app

# Local
tail -f logs/combined.log
```

#### Verify in Database

```bash
# Docker
docker exec -it fcm-mysql mysql -uroot -ppassword fcm_notifications

# Local
mysql -u root -p fcm_notifications

# Then run:
SELECT * FROM fcm_job ORDER BY createdAt DESC LIMIT 10;
```

## 🔧 Troubleshooting

### App Won't Start - Database Error

```bash
# Check if MySQL is running
docker ps | grep fcm-mysql

# If not running, start it
docker start fcm-mysql

# Or create new container (if needed)
docker run -d --name fcm-mysql -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=fcm_notifications -p 3306:3306 mysql:8.0
```

### App Won't Start - Firebase Error

```bash
# Verify service account file exists
ls -la firebase-service-account.json

# If missing, you need to generate it from Firebase Console
```

### Messages Not Being Processed

```bash
# Check if RabbitMQ is running
docker ps | grep fcm-rabbitmq

# Check logs
docker logs fcm-rabbitmq

# View RabbitMQ UI: http://localhost:15672 (guest/guest)
```

### Clean Up / Start Fresh

```bash
# Stop and remove containers
docker stop fcm-mysql fcm-rabbitmq
docker rm fcm-mysql fcm-rabbitmq

# Restart from Step 3 in Quick Start
```

---

## Development

### Project Structure

```
.
├── src/
│   ├── config/          # Configuration and setup
│   │   ├── env.ts       # Environment variables
│   │   ├── logger.ts    # Winston logger setup
│   │   └── database.ts  # MySQL connection
│   ├── models/          # Data models
│   │   └── FcmJob.ts    # FCM job model
│   ├── services/        # Business logic
│   │   ├── firebase.service.ts
│   │   └── rabbitmq.service.ts
│   ├── controllers/     # Request handlers
│   │   └── notification.controller.ts
│   ├── types/           # TypeScript types
│   │   └── message.ts
│   ├── app.ts           # Express app setup
│   └── index.ts         # Application entry point
├── scripts/             # Utility scripts
├── logs/                # Log files
├── Dockerfile
├── docker-compose.yml
└── package.json
```

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Production Deployment

### Environment Variables

Ensure all required environment variables are set:

- Firebase credentials (use JSON string format for containerized deployments)
- Database credentials with strong passwords
- RabbitMQ credentials

### Security Recommendations

1. Use strong passwords for MySQL and RabbitMQ
2. Enable SSL/TLS for database and RabbitMQ connections
3. Run services in a private network
4. Use secrets management (e.g., Docker Secrets, Kubernetes Secrets)
5. Enable Firebase App Check for additional security
6. Monitor rate limits and adjust as needed

📦 Configuration

Environment variables in `.env`:

| Variable                        | Description                  | Default               |
| ------------------------------- | ---------------------------- | --------------------- |
| `PORT`                          | HTTP server port             | 3000                  |
| `FIREBASE_PROJECT_ID`           | Firebase project ID          | (your project)        |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to service account JSON | ./firebase-service... |
| `RABBITMQ_URL`                  | RabbitMQ connection URL      | amqp://localhost:5672 |
| `DB_HOST`                       | MySQL host                   | localhost             |
| `DB_PASSWORD`                   | MySQL password               | password              |

---

## 🚢 Production Deployment

### Docker Compose (Recommended)

```bash
# Edit .env with production values
nano .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app
```

### Security Checklist

- Change default MySQL password
- Create RabbitMQ user (don't use guest)
- Use environment variables for secrets (not committed files)
- Enable HTTPS with reverse proxy
- Restrict network access to MySQL/RabbitMQ
- Set up monitoring and alerts
- Regular backups of MySQL database

---

## 📚 Additional Resources

- **Management UIs:**
    - RabbitMQ: http://localhost:15672 (guest/guest)
    - Health Check: http://localhost:3000/health

- **Log Files:**
    - Combined: `logs/combined.log`
    - Errors only: `logs/error.log`

- **Project Structure:**
    ```
    src/
    ├── config/       # Configuration
    ├── models/       # Database models
    ├── services/     # Firebase, RabbitMQ
    ├── controllers/  # Business logic
    └── types/        # TypeScript types
    ```
