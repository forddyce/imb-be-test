# FCM Notification Service

A Firebase Cloud Messaging (FCM) notification service with RabbitMQ integration. This service consumes messages from a RabbitMQ queue, sends notifications via FCM, stores delivery records in MySQL, and publishes results to a RabbitMQ topic.

## Features

- 📨 Consumes messages from RabbitMQ queue (`notification.fcm`)
- 🔥 Sends push notifications via Firebase Cloud Messaging
- 💾 Stores delivery records in MySQL database
- 📢 Publishes results to RabbitMQ topic (`notification.done`)
- 🔒 Security features (Helmet, CORS, rate limiting)
- 🐳 Fully Dockerized setup
- 📊 Health check endpoint
- 📝 Comprehensive logging

## Architecture

```
RabbitMQ Queue (notification.fcm)
    ↓
  Service consumes & validates message
    ↓
  Firebase Cloud Messaging
    ↓
  MySQL Database (fcm_job table)
    ↓
RabbitMQ Topic (notification.done)
```

## Prerequisites

### For Local Development

- Node.js 18+ and npm
- MySQL 8.0+
- RabbitMQ 3.12+
- Firebase project with FCM enabled

### For Docker Setup

- Docker
- Docker Compose

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing project
3. Enable Firebase Cloud Messaging
4. Generate a service account key:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `firebase-service-account.json` in the project root

## Installation & Setup

### Option 1: Docker Setup (Recommended)

1. **Clone and navigate to project:**

   ```bash
   cd /home/forddyce/web/test
   ```

2. **Create environment file:**

   ```bash
   cp .env.docker .env
   ```

3. **Edit `.env` and add your Firebase credentials:**

   You need to convert your Firebase service account JSON to a single-line string:

   ```bash
   # Option A: Use the service account JSON file
   cat firebase-service-account.json | jq -c .
   # Copy the output and paste it as FIREBASE_SERVICE_ACCOUNT_JSON value

   # Option B: Manually format it as a single line
   # Replace newlines with \n and escape quotes
   ```

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

### Option 2: Local Development Setup

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

| Variable                        | Description                    | Default               |
| ------------------------------- | ------------------------------ | --------------------- |
| `PORT`                          | HTTP server port               | 3000                  |
| `FIREBASE_PROJECT_ID`           | Firebase project ID            | -                     |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to service account JSON   | -                     |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Service account as JSON string | -                     |
| `RABBITMQ_URL`                  | RabbitMQ connection URL        | amqp://localhost:5672 |
| `RABBITMQ_QUEUE_NAME`           | Queue name to consume from     | notification.fcm      |
| `RABBITMQ_TOPIC_NAME`           | Topic name to publish to       | notification.done     |
| `DB_HOST`                       | MySQL host                     | localhost             |
| `DB_NAME`                       | Database name                  | fcm_notifications     |

## Message Format

### Input Message (RabbitMQ Queue)

The service expects JSON messages in this format:

```json
{
  "identifier": "fcm-msg-a1beff5ac",
  "type": "device",
  "deviceId": "device_token_here",
  "text": "Notification message"
}
```

**Field Requirements:**

- `identifier` (string): Unique message identifier
- `type` (string): Message type (currently supports "device")
- `deviceId` (string): FCM device token
- `text` (string): Notification body text

### Output Message (RabbitMQ Topic)

After successful delivery, the service publishes:

```json
{
  "identifier": "fcm-msg-a1beff5ac",
  "deliverAt": "2026-01-31T12:34:56Z"
}
```

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
```

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

### 1. Get a Test Device Token

You need a valid FCM device token. You can get one by:

- Creating a test mobile app with FCM
- Using the web FCM SDK in a test webpage
- Using your VAPID key from Firebase Console

### 2. Publish Test Messages

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
const amqp = require("amqplib");

async function send() {
  const conn = await amqp.connect("amqp://localhost:5672");
  const channel = await conn.createChannel();
  await channel.assertQueue("notification.fcm", { durable: true });

  channel.sendToQueue(
    "notification.fcm",
    Buffer.from(
      JSON.stringify({
        identifier: `test-${Date.now()}`,
        type: "device",
        deviceId: "YOUR_DEVICE_TOKEN",
        text: "Test notification",
      })
    ),
    { persistent: true }
  );

  console.log("Message sent!");
  await channel.close();
  await conn.close();
}

send();
```

### 3. Subscribe to Results

**Using the test script:**

```bash
node scripts/test-subscriber.js
```

This will listen for messages published to the `notification.done` topic.

### 4. Monitor Logs

```bash
# Docker
docker-compose logs -f app

# Local
tail -f logs/combined.log
```

### 5. Verify in Database

```bash
# Docker
docker exec -it fcm-mysql mysql -uroot -ppassword fcm_notifications

# Local
mysql -u root -p fcm_notifications

# Then run:
SELECT * FROM fcm_job ORDER BY createdAt DESC LIMIT 10;
```

## Troubleshooting

### Service Won't Start

Check logs for specific errors:

```bash
docker-compose logs app
```

Common issues:

- Missing Firebase credentials
- Wrong database credentials
- RabbitMQ connection failed

### Messages Not Being Processed

1. Check if RabbitMQ is running:

   ```bash
   curl http://localhost:15672/api/health/checks/alarms
   ```

2. Verify queue exists and has messages:

   - Open http://localhost:15672
   - Check "notification.fcm" queue

3. Check application logs for errors

### Firebase Errors

- **Invalid device token**: The `deviceId` must be a valid FCM registration token
- **Permission denied**: Verify your service account has FCM permissions
- **Project not found**: Check `FIREBASE_PROJECT_ID` matches your Firebase project

### Database Connection Failed

```bash
# Test MySQL connection
docker exec -it fcm-mysql mysqladmin ping -h localhost -u root -ppassword

# Check if database exists
docker exec -it fcm-mysql mysql -uroot -ppassword -e "SHOW DATABASES;"
```

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

### Scaling

- The application is stateless and can be horizontally scaled
- Multiple instances can consume from the same RabbitMQ queue
- Consider using RabbitMQ clustering for high availability
- Use MySQL replication or managed database services

## Monitoring

- Health endpoint: `GET /health`
- Logs: Check `logs/` directory
- RabbitMQ Management UI: http://localhost:15672
- MySQL: Monitor slow queries and connection pool

## License

MIT

## Support

For issues or questions, please check the logs and troubleshooting section above.
