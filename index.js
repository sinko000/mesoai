const { 
    Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, 
    ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, 
    EmbedBuilder, ChannelType, PermissionsBitField 
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Konfiqurasiya
const CONFIG = {
    SUPPORT_ROLE: '1527393296966746244',
    TICKET_CHANNEL: '1526882844947775579'
};

// 1. Ticket menyusunu göndərən funksiya (Bunu istədiyin kanala bir dəfə göndər)
async function sendTicketMenu(channel) {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('ticket_report').setLabel('Report').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('ticket_suggestion').setLabel('Suggestion').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('ticket_question').setLabel('Question').setStyle(ButtonStyle.Secondary)
        );
    
    await channel.send({ content: 'Select an option to open a ticket:', components: [row] });
}

// 2. Düymə basılanda Modal açılması
client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        const type = interaction.customId.replace('ticket_', '');
        const modal = new ModalBuilder().setCustomId(`modal_${type}`).setTitle(`${type.toUpperCase()} Ticket`);
        
        const input = new TextInputBuilder()
            .setCustomId('ticket_input')
            .setLabel('Please describe your request:')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);
            
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
    } 
    
    // 3. Modal göndəriləndə Ticket kanalının yaradılması
    else if (interaction.isModalSubmit()) {
        const [_, type] = interaction.customId.split('_');
        const content = interaction.fields.getTextInputValue('ticket_input');
        const guild = interaction.guild;

        const ticketChannel = await guild.channels.create({
            name: `${type}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: '1526882844947775579', // Parent ID əgər varsa
            permissionOverwrites: [
                { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] },
                { id: CONFIG.SUPPORT_ROLE, allow: [PermissionsBitField.Flags.ViewChannel] }
            ]
        });

        const embed = new EmbedBuilder()
            .setTitle(`New ${type.toUpperCase()} Ticket`)
            .setDescription(`**User:** ${interaction.user}\n**Request:** ${content}`)
            .setColor(0x0099FF);

        await ticketChannel.send({ content: `<@&${CONFIG.SUPPORT_ROLE}>`, embeds: [embed] });
        await interaction.reply({ content: `Ticket created: ${ticketChannel}`, ephemeral: true });
    }
});

client.login('TOKEN');
