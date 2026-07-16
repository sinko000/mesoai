const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');

// Uptime üçün server
const app = express();
app.get('/', (req, res) => res.status(200).send('AI Bot is active!'));
app.listen(process.env.PORT || 10000);

// Gemini AI qurulumu
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    // Yalnız botu etiketləyəndə və ya xüsusi bir prefiks ilə yazanda cavab versin
    // Məsələn: !ai salam
    if (!message.content.startsWith('!ai ')) return;

    const prompt = message.content.slice(4);

    try {
        message.channel.sendTyping(); // AI cavab verərkən "yazır..." effekti
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Cavab çox uzundursa, Discord limitinə görə bölməliyik
        if (text.length > 2000) {
            message.reply(text.substring(0, 1999));
        } else {
            message.reply(text);
        }
    } catch (error) {
        console.error(error);
        message.reply('Üzr istəyirəm, bir xəta baş verdi.');
    }
});

client.login(process.env.TOKEN);
