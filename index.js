const discordjs = require('discord.js'),
	client = new discordjs.Client(),
	secret = require('./secret.json'),
	settings = require('./settings.json'),
    wait = require('util').promisify(setTimeout),
    invites = {};
let dc = {
	invites: [],

	checkChannels: (guild) => {

        let permissions = [{
            id: guild.defaultRole.id,
            deny: ['SEND_MESSAGES', 'SEND_TTS_MESSAGES', 'ATTACH_FILES', 'MENTION_EVERYONE', 'MANAGE_MESSAGES'],
            allow: ['READ_MESSAGE_HISTORY', 'VIEW_CHANNEL', 'ADD_REACTIONS']
        }];

		if (!guild.channels.some(x => x.name === settings.category.channel.name)) {
			guild.createChannel(settings.category.channel.name, {
				type: "category",
				permissionOverwrites: permissions
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
					permissionOverwrites: permissions

				}).then(channel => {
					console.log(`Created #${channel.name} (${channel.id}) on server ${guild.name} (${guild.id})`);
					channel.setParent(guild.channels.find(c => c.name == settings.category.channel.name && c.type == "category").id);
				}).catch(console.error);
			} else if (guild.channels.some(x => x.name === settings.channels[channel].channel.name)) {
				let ch = guild.channels.find(c => c.name == settings.channels[channel].channel.name && c.type == "text");
				// if channel exists and parent is null or not category, move to category
                let category = guild.channels.find(c => c.name == settings.category.channel.name && c.type == "category");
                console.log(ch.parent);
				//if ((category && ch.position == 0 && ch.parentId == null) || (category && ch.parent !== null && ch.parent.name !== settings.category.channel.name)) {
                if (category && 
                    ((ch.position == 0 && ch.parentId == null) || 
                    (ch.parent !== null && ch.parent.name !== settings.category.channel.name))) {
                    ch.setParent(category.id);
					console.log(`Moved channel "#${ch.name}" (${ch.id}) to category "${category.name}" (${category.id}) on server ${guild.name} (${guild.id})`);
				}
			}
		};
	}
}

client.on('ready', () => {
    wait(1000);
	console.log(`\nBot is on ${client.guilds.size} server(s). Join to new with this link:\n` + 
	`https://discordapp.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`);

	client.user.setUsername(settings.bot.name);

	if (client.guilds.size >= 1) {
        console.log(`\nServer list: `);
        
        // cache invites
        client.guilds.forEach(g => {
            g.fetchInvites().then(guildInvites => {
                invites[g.id] = guildInvites;
            });
        });
		
		client.guilds.forEach(guild => {
            console.log(` - ${guild.name} (${guild.id})\n`);
            
			

			dc.checkChannels(guild);
		});
	}
});

// event listener: joined server
client.on("guildCreate", guild => {
	console.log(`Joined a new server: ${guild.name} (${guild.id})`);
	dc.checkChannels(guild);
})

// event listener: removed from server
client.on("guildDelete", guild => {
    console.log(`Kicked out of a server: ${guild.name} (${guild.id}), ${client.user.tag} is now on ${client.guilds.size} servers.`);
});

client.on('guildMemberAdd', member => {
    // To compare, we need to load the current invite list.
    member.guild.fetchInvites().then(guildInvites => {
        // This is the *existing* invites for the guild.
        const ei = invites[member.guild.id];

        // Update the cached invites
        invites[member.guild.id] = guildInvites;

        console.log(ei, guildInvites, guildInvites.find(i => ei.get(i.code).uses < i.uses));
        // Look through the invites, find the one for which the uses went up.
        const invite = guildInvites.find(i => ei.get(i.code).uses < i.uses);

        // if (invite.code === "HrTHHFf") {
        //     return member.addRole(member.guild.roles.find(role => role.name === "TRZ"));
        // }

        const logChannel = member.guild.channels.find(channel => channel.name === "zastępstwa");
        // A real basic message with the information we need. 
        logChannel.send(`${member.user.tag} joined using invite code ${invite.code}. Invite was used nsj times since its creation.`);

        invite.delete();
    });
});




client.on("message", (message) => {
	if (message.content.startsWith("recreate")) {
	  message.channel.send("recreating");
	  client.guilds.forEach(guild => {
		  dc.checkChannels(guild);
	  });
    }
    if (message.content.startsWith("generate")) {
        geninvite(message);
    }
});

async function geninvite(message) {
    var invite = await message.channel.createInvite({
        maxAge: 5000, //maximum time for the invite, in milliseconds
        maxUses: 2, //maximum times it can be used
        unique: true
    });

    message.channel.guild.fetchInvites().then(guildInvites => {
        invites[message.guild.id] = guildInvites;
    });

    message.reply(invite ? `Here's your invite: ${invite}` : "There has been an error during the creation of the invite.");  
}

client.login(secret.key);
//console.log(client);