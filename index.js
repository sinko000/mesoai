const { Client, GatewayIntentBits } = require('discord.js');
const OpenAI = require('openai');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.status(200).send('Bot is active!'));
app.listen(process.env.PORT || 10000);

// OpenAI konfiqurasiyası
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Render-dəki dəyişənin adı bu olmalıdır!
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
            model: "gpt-4o-mini",
        });

        const reply = completion.choices[0].message.content;
        message.reply(reply.length > 2000 ? reply.substring(0, 1999) : reply);
    } catch (error) {
        console.error('OpenAI Error:', error);
        message.reply('API açarında və ya sorğuda xəta var. Xahiş edirəm API açarınızı yoxlayın.');
    }
});

client.login(process.env.TOKEN);
