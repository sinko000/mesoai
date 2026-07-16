const express = require('express');
const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => res.send('Ticket bot is active!'));
app.listen(port, () => console.log(`Server ${port} portunda aktivdir.`));

const { 
    Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, 
    ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, 
    EmbedBuilder, ChannelType, PermissionsBitField 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const CONFIG = {
    SUPPORT_ROLE: '1527393296966746244',
    TICKET_CATEGORY_ID: '1527402873292591204',
    LOG_CHANNEL_ID: 'BURA_LOG_KANAL_ID-NI_QOY' // Ticket arxivinin gedəcəyi kanal ID-si
};

client.once('clientReady', (c) => {
    console.log(`Bot uğurla işə düşdü: ${c.user.tag}`);
});

// Setup
client.on('messageCreate', async (message) => {
    if (message.content === '!setup') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_report').setLabel('Report').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('ticket_suggestion').setLabel('Suggestion').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('ticket_question').setLabel('Question').setStyle(ButtonStyle.Secondary)
        );
        await message.channel.send({ embeds: [new EmbedBuilder().setTitle('🎫 Support Tickets').setDescription('Select below to open a ticket.').setColor(0x2B2D31)], components: [row] });
        await message.delete().catch(() => {});
    }
});

client.on('interactionCreate', async (interaction) => {
    // Düymə (Ticket açmaq və ya Bağlamaq)
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('ticket_')) {
            const type = interaction.customId.replace('ticket_', '');
            const modal = new ModalBuilder().setCustomId(`modal_${type}`).setTitle(`${type.toUpperCase()} Ticket`);
            modal.addComponents(new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId('user_input').setLabel('Describe your request:').setStyle(TextInputStyle.Paragraph).setRequired(true)
            ));
            await interaction.showModal(modal);
        } 
        else if (interaction.customId === 'close_ticket') {
            await interaction.reply('Saving transcript and closing...');
            
            // Mesajları yığ və log kanalına göndər
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            const transcript = messages.reverse().map(m => `[${m.author.tag}]: ${m.content}`).join('\n');
            const logChannel = await interaction.guild.channels.fetch(CONFIG.LOG_CHANNEL_ID);
            
            await logChannel.send({
                content: `**Ticket Closed:** ${interaction.channel.name}\n\`\`\`text\n${transcript}\n\`\`\``
            });

            setTimeout(() => interaction.channel.delete().catch(console.error), 5000);
        }
    } 
    
    // Modal submit
    else if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_')) {
        const type = interaction.customId.replace('modal_', '');
        const userInput = interaction.fields.getTextInputValue('user_input');

        const ticketChannel = await interaction.guild.channels.create({
            name: `${type}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: CONFIG.TICKET_CATEGORY_ID,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                { id: CONFIG.SUPPORT_ROLE, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
            ]
        });

        const closeRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({ 
            content: `<@&${CONFIG.SUPPORT_ROLE}> | Ticket created by ${interaction.user}`, 
            embeds: [new EmbedBuilder().setTitle(`New ${type.toUpperCase()} Ticket`).setDescription(userInput).setColor(0x00FF00)],
            components: [closeRow]
        });

        await interaction.reply({ content: `✅ Created: ${ticketChannel}`, ephemeral: true });
    }
});

client.login(process.env.TOKEN);
