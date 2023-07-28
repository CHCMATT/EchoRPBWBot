let moment = require('moment');
let { EmbedBuilder, time, quote } = require('discord.js');

function strCleanup(str) {
	let cleaned = str.replaceAll('`', '-').replaceAll('\\', '-').trimEnd().trimStart();
	return cleaned;
};

var formatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	maximumFractionDigits: 0
});

function isValidUrl(string) {
	let url;
	try {
		url = new URL(string);
	} catch (_) {
		return false;
	}
	return url.protocol === "http:" || url.protocol === "https:";
}

module.exports.modalSubmit = async (interaction) => {
	try {
		let modalID = interaction.customId;
		switch (modalID) {
			case 'newFishPurchaseModal':
				await interaction.deferReply({ ephemeral: true });

				let discordId = interaction.member.user.id;

				let guild = await interaction.client.guilds.fetch(process.env.DISCORD_SERVER_ID);
				let user = await guild.members.fetch(discordId);

				let employeeName;

				if (user.nickname) {
					employeeName = user.nickname;
				} else {
					employeeName = user.user.username
				}

				/*let guild = await client.guilds.fetch(process.env.DISCORD_SERVER_ID);
				let user = await guild.members.fetch(userId);
				var initCharName;
				if (user.nickname) {
					initCharName = user.nickname;
				} else {
					initCharName = user.user.username;
				}*/
				let today = new Date();
				let purchaseDate = time(today, 'd');

				let fishQuantity = Number(strCleanup(interaction.fields.getTextInputValue('fishQuantityInput')));
				let totalCost = Number(strCleanup(interaction.fields.getTextInputValue('totalCostInput').replaceAll(',', '').replaceAll('$', '')));
				let storageUsed = Number(strCleanup(interaction.fields.getTextInputValue('storageUsedInput')));
				let depositPhotos = strCleanup(interaction.fields.getTextInputValue('depositPhotosInput'));

				await interaction.client.googleSheets.values.append({
					auth: interaction.client.auth, spreadsheetId: process.env.BACKUP_DATA_SHEET_ID, range: "Fish Purchase!A:F", valueInputOption: "RAW", resource: { values: [[employeeName, purchaseDate, fishQuantity, totalCost, storageUsed, depositPhotos]] }
				});

				if (isNaN(fishQuantity)) { // validate quantity of fish purchases
					await interaction.editReply({
						content: `:exclamation: \`${interaction.fields.getTextInputValue('fishQuantityInput')}\` is not a valid number, please be sure to only enter numbers.`,
						ephemeral: true
					});
					return;
				}

				if (isNaN(totalCost)) { // validate quantity of total cost
					await interaction.editReply({
						content: `:exclamation: \`${interaction.fields.getTextInputValue('totalCostInput')}\` is not a valid number, please be sure to only enter numbers.`,
						ephemeral: true
					});
					return;
				}

				if (isNaN(storageUsed)) { // validate quantity of storage used
					await interaction.editReply({
						content: `:exclamation: \`${interaction.fields.getTextInputValue('storageUsedInput')}\` is not a valid number, please be sure to only enter numbers.`,
						ephemeral: true
					});
					return;
				}

				let formattedTotalCost = formatter.format(totalCost);

				var photos = [depositPhotos];
				if (depositPhotos.includes(",")) {
					photos = depositPhotos.split(",")
				} else if (depositPhotos.includes(";")) {
					photos = depositPhotos.split(";")
				} else if (depositPhotos.includes(" ")) {
					photos = depositPhotos.split(" ")
				} else if (depositPhotos.includes("|")) {
					photos = depositPhotos.split("|")
				} else if (photos.length > 1) {
					await interaction.editReply({
						content: `:exclamation: The photos you linked are not separated properly. Please be sure to use commas (\`,\`), semicolons(\`;\`), vertical pipes(\`|\`), or spaces (\` \`) to separate your links.`,
						ephemeral: true
					});
					return;
				}

				for (let i = 0; i < photos.length; i++) {
					if (photos[i] == "") {
						photos.splice(i, 1);
						continue;
					}
					if (!isValidUrl(photos[i])) { // validate photo link
						await interaction.editReply({
							content: `:exclamation: \`${photos[i].trimStart().trimEnd()}\` is not a valid URL, please be sure to enter a URL including the \`http\:\/\/\` or \`https\:\/\/\` portion.`,
							ephemeral: true
						});
						return;
					}
					var allowedValues = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
					if (!RegExp(allowedValues.join('|')).test(photos[i].toLowerCase())) { // validate photo link, again
						await interaction.editReply({
							content: `:exclamation: \`${photos[i].trimStart().trimEnd()}\` is not a valid picture URL, please be sure to enter a URL that includes one of the following: \`.png\`, \`.jpg\`, \`.jpeg\`, \`.gif\`, \`.webp\`.`,
							ephemeral: true
						});
						return;
					}
				}

				if (photos.length >= 10) {
					await interaction.editReply({
						content: `:exclamation: You may only include a maximum of 9 photo links (\`${photos.length}\` detected).`,
						ephemeral: true
					});
					return;
				}

				let fishPurchaseEmbed;

				if (photos.length <= 1) {
					fishPurchaseEmbed = [new EmbedBuilder()
						.setTitle('Some fish have been purchased!')
						.addFields(
							{ name: `Employee Name:`, value: `${employeeName}`, inline: true },
							{ name: `Purchase Date:`, value: `${purchaseDate}`, inline: true },
							{ name: `Quantity Purchased:`, value: `${fishQuantity}` },
							{ name: `Total Cost:`, value: `${formattedTotalCost}` },
							{ name: `Storage Used:`, value: `${storageUsed}` },
							{ name: `Photo of Deposit:`, value: ` ` },
						)
						.setColor('5A189A')];
				} else {
					fishPurchaseEmbed = [new EmbedBuilder()
						.setTitle('Some fish have been purchased!')
						.addFields(
							{ name: `Employee Name:`, value: `${employeeName}`, inline: true },
							{ name: `Purchase Date:`, value: `${purchaseDate}`, inline: true },
							{ name: `Quantity Purchased:`, value: `${fishQuantity}` },
							{ name: `Total Cost:`, value: `${formattedTotalCost}` },
							{ name: `Storage Used:`, value: `${storageUsed}` },
							{ name: `Photos of Deposit:`, value: ` ` },
						)
						.setColor('5A189A')];
				}

				var photosEmbed = photos.map(x => new EmbedBuilder().setColor('5A189A').setURL('https://echorp.net/').setImage(x));

				fishPurchaseEmbed = fishPurchaseEmbed.concat(photosEmbed);

				await interaction.client.channels.cache.get(process.env.PURCHASE_LOG_CHANNEL_ID).send({ embeds: fishPurchaseEmbed });

				await interaction.editReply({
					content: `Successfully logged your purchase of \`${fishQuantity}\` fish for \`${formattedTotalCost}\`!`,
					ephemeral: true
				});

				break;
			default:
				await interaction.reply({
					content: `I'm not familiar with this modal type. Please tag @CHCMATT to fix this issue.`,
					ephemeral: true
				});
				console.log(`Error: Unrecognized modal ID: ${interaction.customId}`);
		}
	} catch (error) {
		if (process.env.BOT_NAME == 'test') {
			console.error(error);
		} else {
			console.error(error);

			let errTime = moment().format('MMMM Do YYYY, h:mm:ss a');;
			let fileParts = __filename.split(/[\\/]/);
			let fileName = fileParts[fileParts.length - 1];

			console.log(`Error occured at ${errTime} at file ${fileName}!`);

			let errorEmbed = [new EmbedBuilder()
				.setTitle(`An error occured on the ${process.env.BOT_NAME} bot file ${fileName}!`)
				.setDescription(`\`\`\`${error.toString().slice(0, 2000)}\`\`\``)
				.setColor('B80600')
				.setFooter({ text: `${errTime}` })];

			await interaction.client.channels.cache.get(process.env.ERROR_LOG_CHANNEL_ID).send({ embeds: errorEmbed });
		}
	}
};