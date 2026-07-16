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

// YENİLƏNMİŞ ID-LƏR
const CONFIG = {
    SUPPORT_ROLE: '1527393296966746244',
    TICKET_CATEGORY_ID: '1527402873292591204'
};

client.once('clientReady', (c) => {
    console.log(`Bot uğurla işə düşdü: ${c.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.content === '!setup') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_report').setLabel('Report').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('ticket_suggestion').setLabel('Suggestion').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('ticket_question').setLabel('Question').setStyle(ButtonStyle.Secondary)
        );

        const embed = new EmbedBuilder()
            .setTitle('🎫 Support Tickets')
            .setDescription('Please select the category of your request below to open a ticket.')
            .setColor(0x2B2D31);

        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete().catch(() => {});
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId.startsWith('ticket_')) {
        const type = interaction.customId.replace('ticket_', '');
        const modal = new ModalBuilder()
            .setCustomId(`modal_${type}`)
            .setTitle(`${type.charAt(0).toUpperCase() + type.slice(1)} Ticket`);

        const input = new TextInputBuilder()
            .setCustomId('user_input')
            .setLabel('Please describe your request:')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1000);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    } 
    
    else if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_')) {
        const type = interaction.customId.replace('modal_', '');
        const userInput = interaction.fields.getTextInputValue('user_input');
        const guild = interaction.guild;

        try {
            const ticketChannel = await guild.channels.create({
                name: `${type}-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: CONFIG.TICKET_CATEGORY_ID,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                    { id: CONFIG.SUPPORT_ROLE, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                ]
            });

            await ticketChannel.send({ 
                content: `<@&${CONFIG.SUPPORT_ROLE}> | Ticket created by ${interaction.user}`, 
                embeds: [new EmbedBuilder()
                    .setTitle(`New ${type.toUpperCase()} Ticket`)
                    .setDescription(`**User:** ${interaction.user}\n**Details:**\n${userInput}`)
                    .setColor(0x00FF00)] 
            });

            await interaction.reply({ content: `✅ Your ticket has been created: ${ticketChannel}`, ephemeral: true });
        } catch (error) {
            console.error('Ticket yaratma xətası:', error);
            await interaction.reply({ content: '❌ Error: Could not create channel. Please check category ID and bot permissions.', ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);
