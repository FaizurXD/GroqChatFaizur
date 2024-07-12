const express = require('express');
const axios = require('axios');
const { Client, Intents, MessageEmbed } = require('discord.js');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
require('dotenv').config();

const app = express();
app.use(express.json());

// Setup rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 99 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Setup logging
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const PORT = process.env.PORT || 3000;

const client = new Client({ intents: 32767 });

client.once('ready', () => {
    console.log('Discord bot is ready!');
});

client.login(DISCORD_TOKEN);

app.post('/faizur/payment/gateway/order/success', async (req, res) => {
    try {
        const orderData = req.body;
        console.log(orderData);

        const orderedItems = orderData.items.map(item => item.name).join(', ');

        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('New Order Received!')
            .setDescription('Here are the details of the new order:')
            .addFields(
                { name: 'Username', value: orderData.username, inline: true },
                { name: 'Account Type', value: orderData.accountType, inline: true },
                { name: 'Currency', value: orderData.currency, inline: true },
                { name: 'Server Type', value: orderData.serverType, inline: true },
                { name: 'Total Price', value: orderData.totalPrice, inline: true },
                { name: 'Transaction ID', value: orderData.transactionId, inline: true },
                { name: 'Ordered Items', value: orderedItems, inline: false }
            )
            .setTimestamp()
            .setFooter('Faizur');

        const channel = await client.channels.fetch(CHANNEL_ID);
        await channel.send({ embeds: [embed] });

        res.status(200).send({ message: 'Order received and sent to Discord channel successfully.' });
    } catch (error) {
        logger.error('Error processing order:', error);
        res.status(500).send({ message: 'Failed to process order.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
