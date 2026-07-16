const { Client, GatewayIntentBits } = require('discord.js');
const OpenAI = require('openai');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.status(200).send('ChatGPT Bot is active!'));
app.listen(process.env.PORT || 10000);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o-mini", // Ən sürətli və ucuz model
        });

        const reply = completion.choices[0].message.content;
        
        if (reply.length > 2000) {
            const chunks = reply.match(/.{1,2000}/g);
            for (const chunk of chunks) await message.reply(chunk);
        } else {
            await message.reply(reply);
        }
    } catch (error) {
        console.error('OpenAI Error:', error);
        message.reply('Sualınızı emal edərkən xəta baş verdi.');
    }
});

client.login(process.env.TOKEN);
