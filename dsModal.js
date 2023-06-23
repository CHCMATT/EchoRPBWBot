var moment = require('moment');
var dbCmds = require('./dbCmds.js');
var editEmbed = require('./editEmbed.js');
var { EmbedBuilder } = require('discord.js');
var personnelCmds = require('./personnelCmds.js');

var formatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	maximumFractionDigits: 0
});

function strCleanup(str) {
	var cleaned = str.replaceAll('`', '-').replaceAll('\\', '-').trimEnd().trimStart();
	return cleaned;
};

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
		var modalID = interaction.customId;
		switch (modalID) {
			case 'addHouseSoldModal':
				var realtorName;
				if (interaction.member.nickname) {
					realtorName = interaction.member.nickname;
				} else {
					realtorName = interaction.member.user.username;
				}

				var now = Math.floor(new Date().getTime() / 1000.0);
				var saleDate = `<t:${now}:d>`;

				var soldTo = strCleanup(interaction.fields.getTextInputValue('soldToInput'));
				var lotNum = strCleanup(interaction.fields.getTextInputValue('lotNumInput'));
				var price = Math.abs(Number(strCleanup(interaction.fields.getTextInputValue('priceInput')).replaceAll(',', '').replaceAll('$', '')));
				var locationNotes = strCleanup(interaction.fields.getTextInputValue('locNotesInput'));
				var photosString = strCleanup(interaction.fields.getTextInputValue('photosInput'));

				await interaction.client.googleSheets.values.append({
					auth: interaction.client.sheetsAuth, spreadsheetId: process.env.BACKUP_DATA_SHEET_ID, range: "House Sales!A:G", valueInputOption: "RAW", resource: { values: [[`${realtorName} (<@${interaction.user.id}>)`, saleDate, lotNum, price, soldTo, locationNotes, photosString]] }
				});

				var formattedPrice = formatter.format(price);
				var costPrice = (price * 0.70);
				var d8Profit = price - costPrice;
				var realtorCommission = (d8Profit * 0.20);

				var formattedCostPrice = formatter.format(costPrice);
				var formattedD8Profit = formatter.format(d8Profit);
				var formattedRealtorCommission = formatter.format(realtorCommission);

				if (isNaN(price)) { // validate quantity of money
					await interaction.reply({
						content: `:exclamation: \`${interaction.fields.getTextInputValue('priceInput')}\` is not a valid number, please be sure to only enter numbers.`,
						ephemeral: true
					});
					return;
				}
				else {
					var photos = [photosString];
					if (photosString.includes(",")) {
						photos = photosString.split(",")
					} else if (photosString.includes(";")) {
						photos = photosString.split(";")
					} else if (photosString.includes(" ")) {
						photos = photosString.split(" ")
					} else if (photosString.includes("|")) {
						photos = photosString.split("|")
					} else if (photos.length > 1) {
						await interaction.reply({
							content: `:exclamation: The photos you linked are not separated properly *(or you didn't submit multiple photos)*. Please be sure to use commas (\`,\`), semicolons(\`;\`), vertical pipes(\`|\`), or spaces (\` \`) to separate your links.`,
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
							await interaction.reply({
								content: `:exclamation: \`${photos[i].trimStart().trimEnd()}\` is not a valid URL, please be sure to enter a URL including the \`http\:\/\/\` or \`https\:\/\/\` portion.`,
								ephemeral: true
							});
							return;
						}
						var allowedValues = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
						if (!RegExp(allowedValues.join('|')).test(photos[i].toLowerCase())) { // validate photo link, again
							await interaction.reply({
								content: `:exclamation: \`${photos[i].trimStart().trimEnd()}\` is not a valid picture URL, please be sure to enter a URL that includes one of the following: \`.png\`, \`.jpg\`, \`.jpeg\`, \`.gif\`, \`.webp\`.`,
								ephemeral: true
							});
							return;
						}
					}

					if (photos.length >= 10) {
						await interaction.reply({
							content: `:exclamation: You may only include a maximum of 9 photo links (\`${photos.length}\` detected).`,
							ephemeral: true
						});
						return;
					}

					var embeds = [new EmbedBuilder()
						.setTitle('A new House has been sold!')
						.addFields(
							{ name: `Realtor Name:`, value: `${realtorName} (<@${interaction.user.id}>)` },
							{ name: `Sale Date:`, value: `${saleDate}` },
							{ name: `Lot Number:`, value: `${lotNum}` },
							{ name: `Final Sale Price:`, value: `${formattedPrice}` },
							{ name: `House Sold To:`, value: `${soldTo}` },
							{ name: `Location/Notes:`, value: `${locationNotes}` }
						)
						.setColor('805B10')];

					var photosEmbed = photos.map(x => new EmbedBuilder().setColor('805B10').setURL('https://echorp.net/').setImage(x));

					embeds = embeds.concat(photosEmbed);

					await interaction.client.channels.cache.get(process.env.HOUSE_SALES_CHANNEL_ID).send({ embeds: embeds });
				}
				var personnelStats = await dbCmds.readPersStats(interaction.member.user.id);
				if (personnelStats == null || personnelStats.charName == null) {
					await personnelCmds.initPersonnel(interaction.client, interaction.member.user.id);
				}
				await dbCmds.addOneSumm("countHousesSold");
				await dbCmds.addOneSumm("countMonthlyHousesSold");
				await dbCmds.addOnePersStat(interaction.member.user.id, "housesSold");
				await dbCmds.addOnePersStat(interaction.member.user.id, "monthlyHousesSold");
				await editEmbed.editEmbed(interaction.client);
				if (realtorCommission > 0) {
					await dbCmds.addCommission(interaction.member.user.id, realtorCommission);
				}
				var currCommission = formatter.format(await dbCmds.readCommission(interaction.member.user.id));

				if (realtorCommission > 0) {
					var formattedCommission = formatter.format(realtorCommission);
					var reason = `House Sale to \`${soldTo}\` costing \`${formattedPrice}\` on ${saleDate}`

					// success/failure color palette: https://coolors.co/palette/706677-7bc950-fffbfe-13262b-1ca3c4-b80600-1ec276-ffa630
					var notificationEmbed = new EmbedBuilder()
						.setTitle('Commission Modified Automatically:')
						.setDescription(`\`System\` added \`${formattedCommission}\` to <@${interaction.user.id}>'s current commission for a new total of \`${currCommission}\`.\n\n**Reason:** ${reason}.`)
						.setColor('#1EC276');
					await interaction.client.channels.cache.get(process.env.COMMISSION_LOGS_CHANNEL_ID).send({ embeds: [notificationEmbed] });
				}

				var newHousesSoldTotal = await dbCmds.readSummValue("countHousesSold");

				await interaction.reply({ content: `Successfully added \`1\` to the \`Houses Sold\` counter - the new total is \`${newHousesSoldTotal}\`.\n\nDetails about this sale:\n> Sale Price: \`${formattedPrice}\`\n> Cost Price: \`${formattedCostPrice}\`\n> Dynasty 8 Profit: \`${formattedD8Profit}\`\n> Your Commission: \`${formattedRealtorCommission}\`\n\nYour weekly commission is now: \`${currCommission}\`.`, ephemeral: true });
				break;
			default:
				await interaction.reply({
					content: `I'm not familiar with this modal type. Please tag @CHCMATT to fix this issue.`,
					ephemeral: true
				});
				console.log(`Error: Unrecognized modal ID: ${interaction.customId}`);
		}
	} catch (error) {
		console.log(`Error in modal popup!`);
		console.error(error);
	}
};


