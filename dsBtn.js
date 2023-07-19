let moment = require('moment');
let { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');

module.exports.btnPressed = async (interaction) => {
	try {
		let buttonID = interaction.customId;
		switch (buttonID) {
			case 'newFishPurchase':
				let newFishPurchaseModal = new ModalBuilder()
					.setCustomId('newFishPurchaseModal')
					.setTitle('Log a purchase of fish');
				let fishQuantity = new TextInputBuilder()
					.setCustomId('fishQuantityInput')
					.setLabel("How many fish did you purchase?")
					.setStyle(TextInputStyle.Short)
					.setPlaceholder('21')
					.setRequired(true);
				let totalCost = new TextInputBuilder()
					.setCustomId('totalCostInput')
					.setLabel("How much did you pay for the fish?")
					.setStyle(TextInputStyle.Short)
					.setPlaceholder('$250')
					.setRequired(true);
				let storageUsed = new TextInputBuilder()
					.setCustomId('storageUsedInput')
					.setLabel("How much storage was used?")
					.setStyle(TextInputStyle.Short)
					.setPlaceholder('400')
					.setRequired(true);
				let depositPhotos = new TextInputBuilder()
					.setCustomId('depositPhotosInput')
					.setLabel("Please submit a photo of the deposit")
					.setStyle(TextInputStyle.Short)
					.setPlaceholder('https://i.imgur.com/B8cps9d.png')
					.setRequired(true);

				let fishQuantityRow = new ActionRowBuilder().addComponents(fishQuantity);
				let totalCostRow = new ActionRowBuilder().addComponents(totalCost);
				let storageUsedRow = new ActionRowBuilder().addComponents(storageUsed);
				let depositPhotosRow = new ActionRowBuilder().addComponents(depositPhotos);

				newFishPurchaseModal.addComponents(fishQuantityRow, totalCostRow, storageUsedRow, depositPhotosRow);

				await interaction.showModal(newFishPurchaseModal);

				break;
			default:
				await interaction.reply({ content: `I'm not familiar with this button press. Please tag @CHCMATT to fix this issue.`, ephemeral: true });
				console.log(`Error: Unrecognized button press: ${interaction.customId}`);
		}
	} catch (error) {
		if (process.env.BOT_NAME == 'test') {
			console.error(error);
		} else {
			console.log(`Error occured at ${errTime} at file ${fileName}!`);
			console.error(error);

			let errTime = moment().format('MMMM Do YYYY, h:mm:ss a');;
			let fileParts = __filename.split(/[\\/]/);
			let fileName = fileParts[fileParts.length - 1];

			let errorEmbed = [new EmbedBuilder()
				.setTitle(`An error occured on the ${process.env.BOT_NAME} bot file ${fileName}!`)
				.setDescription(`\`\`\`${error.toString().slice(0, 2000)}\`\`\``)
				.setColor('B80600')
				.setFooter({ text: `${errTime}` })];

			await interaction.client.channels.cache.get(process.env.ERROR_LOG_CHANNEL_ID).send({ embeds: errorEmbed });
		}
	}
};