#!/usr/bin/env node

const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE_NAME = process.env.RABBITMQ_QUEUE_NAME || 'notification.fcm';

async function publishTestMessage() {
    let connection;
    let channel;

    try {
        console.log('Connecting to RabbitMQ...');
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertQueue(QUEUE_NAME, { durable: true });

        const testMessage = {
            identifier: `fcm-msg-${Date.now()}`,
            type: 'device',
            deviceId:
                'fbdx9hj45OvU1bZc8ubItS:APA91bGvnlvgHIhCxi6J4NbpFP4ImzPbSirq67HAI88gA45ghPv76GrY_-_LzHo0xK95vmeeMHPhYUflzSqaCMluhuDR2Z7gIedoTsjRjN1-h8LDrdMg8GY',
            text: 'This is a test notification from the test script',
        };

        channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(testMessage)), {
            persistent: true,
        });

        console.log('✅ Test message published successfully:');
        console.log(JSON.stringify(testMessage, null, 2));

        await channel.close();
        await connection.close();
    } catch (error) {
        console.error('❌ Error publishing message:', error.message);
        if (channel) await channel.close();
        if (connection) await connection.close();
        process.exit(1);
    }
}

publishTestMessage();
