let moment = require('moment');
let dbCmds = require('./dbCmds.js');
let { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports.postEmbed = async (client) => {
	try {
		// theme color palette: https://coolors.co/palette/10002b-240046-3c096c-5a189a-7b2cbf-9d4edd-c77dff-e0aaff

		let fishPurchaseEmbed = new EmbedBuilder()
			.setTitle('Log a Fish Purchase')
			.setDescription('Press the button below to log a purchase of fish!')
			.setColor('3C096C');

		let btnRows = addBtnRows();

		client.embedMsg = await client.channels.cache.get(process.env.EMBED_CHANNEL_ID).send({ embeds: [fishPurchaseEmbed], components: btnRows });

		await dbCmds.setMsgId("embedMsg", client.embedMsg.id);
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

function addBtnRows() {
	let row1 = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId('newFishPurchase')
			.setLabel('Log a Fish Purchase')
			.setStyle(ButtonStyle.Success),
	);

	let rows = [row1];
	return rows;
};