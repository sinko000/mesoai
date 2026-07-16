const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.status(200).send('Bot is active!'));
app.listen(process.env.PORT || 10000);

// API AÇARINI BURAYA YAPIŞDIR (Dırnaqların içinə)
const genAI = new GoogleGenerativeAI("AQ.Ab8RN6I1fLwb5U-5hyOpXOWsVNy4kCFyfG8ZuWyJ5XjG-dRjVQ"); 

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!ai ')) return;
    const prompt = message.content.slice(4).trim();
    if (!prompt) return;

    try {
        message.channel.sendTyping();
        const result = await model.generateContent(prompt);
        message.reply(result.response.text());
    } catch (error) {
        console.error('Gemini Error:', error);
        message.reply('AI cavab verə bilmədi.');
    }
});

client.login(process.env.TOKEN);
