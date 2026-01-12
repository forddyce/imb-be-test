#!/usr/bin/env node

const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const TOPIC_NAME = process.env.RABBITMQ_TOPIC_NAME || 'notification.done';

async function subscribeToTopic() {
    let connection;
    let channel;

    try {
        console.log('Connecting to RabbitMQ...');
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertExchange(TOPIC_NAME, 'fanout', { durable: true });

        const q = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(q.queue, TOPIC_NAME, '');

        console.log(`✅ Waiting for messages from topic: ${TOPIC_NAME}`);
        console.log('Press CTRL+C to exit\n');

        channel.consume(
            q.queue,
            (msg) => {
                if (msg) {
                    const content = msg.content.toString();
                    console.log('📨 Received message:');
                    console.log(JSON.stringify(JSON.parse(content), null, 2));
                    console.log('---');
                }
            },
            { noAck: true }
        );
    } catch (error) {
        console.error('❌ Error subscribing to topic:', error.message);
        if (channel) await channel.close();
        if (connection) await connection.close();
        process.exit(1);
    }
}

subscribeToTopic();
