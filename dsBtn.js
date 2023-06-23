var moment = require('moment');
var { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports.btnPressed = async (interaction) => {
	try {
		var buttonID = interaction.customId;
		switch (buttonID) {
			case 'addHouseSold':
				var addHouseSoldModal = new ModalBuilder()
					.setCustomId('addHouseSoldModal')
					.setTitle('Log a house that you sold');
				var soldToInput = new TextInputBuilder()
					.setCustomId('soldToInput')
					.setLabel("What is the name and info of the buyer?")
					.setStyle(TextInputStyle.Short)
					.setPlaceholder('FirstName LastName - CID - DOB')
					.setRequired(true);
				var lotNumInput = new TextInputBuilder()
					.setCustomId('lotNumInput')
					.setLabel("What is the house lot number?")
					.setStyle(TextInputStyle.Short)
					.setPlaceholder('1234')
					.setRequired(true);
				var priceInput = new TextInputBuilder()
					.setCustomId('priceInput')
					.setLabel("What was the final sale price?")
					.setStyle(TextInputStyle.Short)
					.setPlaceholder('150000')
					.setRequired(true);
				var locNotesInput = new TextInputBuilder()
					.setCustomId('locNotesInput')
					.setLabel("What is the locat. and notes about the sale?")
					.setStyle(TextInputStyle.Short)
					.setPlaceholder('Baytree Canyon Rd, provided smart locks, 956-252-1929')
					.setRequired(true);
				var photosInput = new TextInputBuilder()
					.setCustomId('photosInput')
					.setLabel("Include photos of GPS & front of house")
					.setStyle(TextInputStyle.Paragraph)
					.setPlaceholder('https://i.imgur.com/wgJiq13.jpg, https://i.imgur.com/hv6jVYT.jpg')
					.setRequired(true);

				// meme gallery: https://imgur.com/gallery/Et0Qm

				var soldToInputRow = new ActionRowBuilder().addComponents(soldToInput);
				var lotNumInputRow = new ActionRowBuilder().addComponents(lotNumInput);
				var priceInputRow = new ActionRowBuilder().addComponents(priceInput);
				var locNotesInputRow = new ActionRowBuilder().addComponents(locNotesInput);
				var photosInputRow = new ActionRowBuilder().addComponents(photosInput);

				addHouseSoldModal.addComponents(soldToInputRow, lotNumInputRow, priceInputRow, locNotesInputRow, photosInputRow);

				await interaction.showModal(addHouseSoldModal);
				break;
			default:
				await interaction.editReply({ content: `I'm not familiar with this button press. Please tag @CHCMATT to fix this issue.`, ephemeral: true });
				console.log(`Error: Unrecognized button press: ${interaction.customId}`);
		}
	}
	catch (error) {
		console.log(`Error in button press!`);
		console.error(error);
	}
};