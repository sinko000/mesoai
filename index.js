// Kodun ən başına bunları əlavə et:
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot is active!'));
app.listen(process.env.PORT || 3000);
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
    TICKET_CATEGORY_ID: '1526882844947775579'
};

// Bot işə düşəndə
client.once('ready', () => {
    console.log(`Bot uğurla işə düşdü: ${client.user.tag}`);
});

// Admin üçün mesajı göndərmək komandası (!setup)
client.on('messageCreate', async (message) => {
    if (message.content === '!setup') {
        // Təhlükəsizlik üçün: Yalnız adminlər edə bilsin deyə yoxlaya bilərsən
        // if (!message.member.permissions.has('Administrator')) return;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_report')
                .setLabel('Report')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('ticket_suggestion')
                .setLabel('Suggestion')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('ticket_question')
                .setLabel('Question')
                .setStyle(ButtonStyle.Secondary)
        );

        const embed = new EmbedBuilder()
            .setTitle('🎫 Support Tickets')
            .setDescription('Please select the category of your request below to open a ticket.')
            .setColor(0x2B2D31);

        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete().catch(() => {}); // Komandanı silir
    }
});

// Düymə və Modal əməliyyatları
client.on('interactionCreate', async (interaction) => {
    // 1. Düyməyə basıldıqda Modal açılır
    if (interaction.isButton() && interaction.customId.startsWith('ticket_')) {
        const type = interaction.customId.replace('ticket_', '');
        
        const modal = new ModalBuilder()
            .setCustomId(`modal_${type}`)
            .setTitle(`${type.charAt(0).toUpperCase() + type.slice(1)} Ticket`);

        // Hər düymə üçün fərqli sual məntiqi
        let questionLabel = 'Please describe your request:';
        if (type === 'report') questionLabel = 'Who are you reporting and why?';
        else if (type === 'suggestion') questionLabel = 'What is your suggestion?';
        else if (type === 'question') questionLabel = 'What is your question?';

        const input = new TextInputBuilder()
            .setCustomId('user_input')
            .setLabel(questionLabel)
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1000);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    } 
    
    // 2. Modal göndərildikdə Ticket yaradılır
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
                    {
                        id: guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel] // Hamıya bağlı
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] // Açan adama açıq
                    },
                    {
                        id: CONFIG.SUPPORT_ROLE,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] // Rol üçün açıq
                    }
                ]
            });

            const embed = new EmbedBuilder()
                .setTitle(`New ${type.toUpperCase()} Ticket`)
                .setDescription(`**User:** ${interaction.user}\n**Details:**\n${userInput}`)
                .setColor(0x00FF00)
                .setTimestamp();

            // Yeni kanala mesaj və rolu etiketləmə
            await ticketChannel.send({ 
                content: `<@&${CONFIG.SUPPORT_ROLE}> | Ticket created by ${interaction.user}`, 
                embeds: [embed] 
            });

            await interaction.reply({ content: `✅ Your ticket has been created: ${ticketChannel}`, ephemeral: true });

        } catch (error) {
            console.error('Ticket yaratma xətası:', error);
            await interaction.reply({ content: '❌ There was an error creating your ticket. Please make sure the Category ID is correct.', ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);
