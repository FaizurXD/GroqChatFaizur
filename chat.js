const express = require('express');
const { Client, Intents, MessageEmbed } = require('discord.js');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const Joi = require('joi');
require('dotenv').config();

const app = express();
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 99
});
app.use(limiter);

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const PORT = 3000;

const client = new Client({ intents: 32767 });

client.once('ready', () => {
    console.log('Discord bot is ready!');
    logger.info('Discord bot is ready!');
});

client.login(DISCORD_TOKEN).catch(error => {
    logger.error('Failed to login to Discord:', error);
});

const orderSchema = Joi.object({
    username: Joi.string().required(),
    accountType: Joi.string().required(),
    currency: Joi.string().valid('INR', 'PKR').required(),
    serverType: Joi.string().required(),
    totalPrice: Joi.number().required(),
    transactionId: Joi.string().required(),
    items: Joi.array().items(Joi.object({ name: Joi.string().required() })).required()
});

app.post('/faizurpg', async (req, res) => {
    try {
        logger.info('Received a request to /faizurpg');
        const { error } = orderSchema.validate(req.body);
        if (error) {
            logger.warn('Invalid request format:', error.details[0].message);
            return res.status(400).send({ message: `Invalid request format: ${error.details[0].message}` });
        }

        const orderData = req.body;
        if (!orderData || Object.keys(orderData).length === 0) {
            logger.warn('Received an empty request');
            return res.status(400).send({ message: 'Your request is empty' });
        }

        logger.info('Order data:', orderData);

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
                { name: 'Total Price', value: orderData.totalPrice.toString(), inline: true },
                { name: 'Transaction ID', value: orderData.transactionId, inline: true },
                { name: 'Ordered Items', value: orderedItems, inline: false }
            )
            .setTimestamp()
            .setFooter('Faizur');

        const channel = await client.channels.fetch(CHANNEL_ID);
        await channel.send({ embeds: [embed] });

        logger.info('Order sent to Discord channel successfully');
        res.status(200).send({ message: 'Order received and sent to Discord channel successfully.' });
    } catch (error) {
        logger.error('Error processing order:', error);
        res.status(500).send({ message: `Failed to process order: ${error.message}` });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    logger.info(`Server is running on port ${PORT}`);
});
