const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');

// Uptime üçün server
const app = express();
app.get('/', (req, res) => res.status(200).send('AI Bot is active!'));
app.listen(process.env.PORT || 10000);

// Gemini AI qurulumu - Stabil model istifadə edirik
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" }); 

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`Bot is online as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    // Yalnız !ai ilə başlayan mesajları oxusun
    if (!message.content.startsWith('!ai ')) return;

    const prompt = message.content.slice(4).trim();
    if (!prompt) return message.reply('Please provide a message for the AI.');

    try {
        message.channel.sendTyping(); 
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Cavab çox uzundursa böl
        if (text.length > 2000) {
            const chunks = text.match(/.{1,2000}/g);
            for (const chunk of chunks) {
                await message.reply(chunk);
            }
        } else {
            await message.reply(text);
        }
    } catch (error) {
        console.error('AI Error:', error);
        message.reply('Sorry, I encountered an error while processing your request.');
    }
});

client.login(process.env.TOKEN);
