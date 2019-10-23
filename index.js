const discordjs = require('discord.js'),
	client = new discordjs.Client(),
	secret = require('./secret.json'),
	settings = require('./settings.json');

const checkChannels = (guild) => {

	if (!guild.channels.some(x => x.name === settings.category.channel.name)) {

		guild.createChannel(settings.category.channel.name, {
			
			type: "category",

			permissionOverwrites: [{
				id: guild.id,
				deny: ['SEND_MESSAGES', 'SEND_TTS_MESSAGES', 'ATTACH_FILES', 'MENTION_EVERYONE', 'MANAGE_MESSAGES'],
				allow: ['READ_MESSAGE_HISTORY', 'VIEW_CHANNEL', 'ADD_REACTIONS']
			}]

		})
		.then(channel => {
			
			console.log(`Created #${channel.name} (${channel.id}) on server ${guild.name} (${guild.id})`);
		
		})
		.catch(console.error);
	}


	for (let channel in settings.channels) {
		if(!guild.channels.some(x => x.name === settings.channels[channel].channel.name)) {

			guild.createChannel(settings.channels[channel].channel.name, {

				type: "text",

				permissionOverwrites: [{
					id: guild.id + 1,
					deny: ['SEND_MESSAGES', 'SEND_TTS_MESSAGES', 'ATTACH_FILES', 'MENTION_EVERYONE', 'MANAGE_MESSAGES'],
					allow: ['READ_MESSAGE_HISTORY', 'VIEW_CHANNEL', 'ADD_REACTIONS']
				}]

			}).then(channel => {

				console.log(`Created #${channel.name} (${channel.id}) on server ${guild.name} (${guild.id})`);
				channel.setParent(guild.channels.find(c => c.name == settings.category.channel.name && c.type == "category").id);

			}).catch(console.error);

		} else if (guild.channels.some(x => x.name === settings.channels[channel].channel.name)) {
			let ch = guild.channels.find(c => c.name == settings.channels[channel].channel.name && c.type == "text");

			// if channel exists and parent is null or not category, move to category

			let category = guild.channels.find(c => c.name == settings.category.channel.name && c.type == "category");
			
			if (category && ch.parent.name !== null && ch.parent.name !== settings.category.channel.name) {

				ch.setParent(category.id);
				console.log(`Moved channel "#${ch.name}" (${ch.id}) to category "${category.name} (${category.id}) on server ${guild.name} (${guild.id})`);
			
			}
		}
	};
}

client.on('ready', () => {
	console.log(`\nBot is on ${client.guilds.size} server(s). Join to new with this link:\n` + 
	`https://discordapp.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`);

	client.user.setUsername(settings.bot.name);

	if (client.guilds.size >= 1) {
		console.log(`\nServer list: `);
		
		client.guilds.forEach(guild => {
			console.log(` - ${guild.name} (${guild.id})\n`);
			checkChannels(guild);
		});
	}
});

// event listener: joined server
client.on("guildCreate", guild => {
	console.log(`Joined a new server: ${guild.name} (${guild.id})`);
	checkChannels(guild);
})

// event listener: removed from server
client.on("guildDelete", guild => {
    console.log(`Kicked out of a server: ${guild.name} (${guild.id}), ${client.user.tag} is now on ${client.guilds.size} servers.`);
});

client.on("message", (message) => {
	if (message.content.startsWith("ping")) {
	  message.channel.send("pong!");
	}
});

client.login(secret.key);
//console.log(client);