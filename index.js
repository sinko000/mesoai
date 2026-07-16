const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');

// Uptime üçün server
const app = express();
app.get('/', (req, res) => res.status(200).send('Bot is active!'));
app.listen(process.env.PORT || 10000);

// SƏRT KODLAMA (Hardcoded API Key)
const genAI = new GoogleGenerativeAI("AQ.Ab8RN6Ly9pCioHkT_fBHMyCssQMABKFdVuc_Jtc9KUvaLi_qQg");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`Bot uğurla işə düşdü: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!ai ')) return;

    const prompt = message.content.slice(4).trim();
    if (!prompt) return;

    try {
        message.channel.sendTyping();
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        message.reply(text.length > 2000 ? text.substring(0, 1999) : text);
    } catch (error) {
        console.error('Gemini Error:', error);
        message.reply('AI cavab verə bilmədi. Loglara bax.');
    }
});

client.login(process.env.TOKEN);
