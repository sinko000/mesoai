const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');

const app = express();
app.listen(process.env.PORT || 10000);

// API açarını buraya birbaşa yapışdır (Dırnaq içində)
const genAI = new GoogleGenerativeAI("AQ.Ab8RN6IKRK7ZweaUgrz5nfMUWcJ8ynN2V6slfi7VDV-NRGsjGQ"); 
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`Bot hazırdır!`);
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
        message.reply('AI xəta verdi.');
    }
});

client.login(process.env.TOKEN);
