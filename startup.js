require('discord.js');
let moment = require('moment');
let dbCmds = require('./dbCmds.js');
let postEmbed = require('./postEmbed.js');
let editEmbed = require('./editEmbed.js');
let { EmbedBuilder } = require('discord.js');

module.exports.startUp = async (client) => {
	try {
		let channel = await client.channels.fetch(process.env.EMBED_CHANNEL_ID);
		let embedMsgId = await dbCmds.readMsgId("embedMsg");

		try {
			await channel.messages.fetch(embedMsgId);
			editEmbed.editEmbed(client);
			return "edited";
		}
		catch (error) {
			postEmbed.postEmbed(client);
			return "posted";
		}
	} catch (error) {
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
};