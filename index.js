const { Client, GatewayIntentBits, ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { token, clientId, serverlistUrl } = require('./config.json');
const { servers, StartServer, StopServer, FindServer } = require("./server_handler");

require('./commands.js')


const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});



const waitEmbed = new EmbedBuilder()
						.setColor(0x00cc75)
						.setTitle('Starting a server...')
						.setAuthor({ name: 'Adammantium Multiplayer Mod', iconURL: 'https://devforce.de/img/icons/AMP.png', url: 'https://www.nexusmods.com/bladeandsorcery/mods/6888' })
						.setDescription('A new server for you to play on is starting up, please wait...')
						.setTimestamp();


client.on('interactionCreate', async interaction => {
	if (!interaction.isButton()) return;
  
	if(interaction.customId == "close_server") {
		var server = FindServer(interaction.user);
		
		if(server) {
			await StopServer(interaction.user);
			
			if(server.interaction) {
				await server.interaction.editReply({
					content: 'Server closed!',
					ephemeral: true,
					embeds: [ ],
					components: [ ]
				});
			} else {
				await interaction.reply({
					content: 'Server closed!',
					ephemeral: true,
					embeds: [ ],
					components: [ ]
				});
			}
		}
	} else if(interaction.customId == "announce") {
		var server = FindServer(interaction.user);
		if(server) {
			const serverEmbed = new EmbedBuilder()
							.setColor(0x00cc75)
							.setTitle(server.name)
							.setAuthor({ name: 'Adammantium Multiplayer Mod', iconURL: 'https://devforce.de/img/icons/AMP.png', url: 'https://www.nexusmods.com/bladeandsorcery/mods/6888' })
							.addFields(
								{ name: 'Name', value: server.name },
								{ name: 'Address', value: '' + server.address, inline: true },
								{ name: "Port", value: '' + server.port, inline: true },
								{ name: "Max-Players", value: '10', inline: true },
							)
							.setTimestamp();
		
			const row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setLabel('Join Server')
						.setStyle(ButtonStyle.Link)
						.setURL(makeInviteUrl(server))
				);
		
			server.announce = await interaction.channel.send({ 	
				content: '<@' + interaction.user.id + '> is hosting a server!',
				embeds: [ serverEmbed ],
				components: [ row ]
			});
		}else{
			await interaction.reply({
				content: 'No server hosted.',
				ephemeral: true,
				embeds: [ ],
				components: [ ]
			});
		}
	}
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'host') {
	await interaction.reply({ content: "Okay, i will spin up a new server for you!",
										  embeds: [ waitEmbed ],
										  ephemeral: true
										});
							
	var server = await StartServer(interaction.user);
	
	if(server) {
		server.interaction = interaction;
		
		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setLabel('Join Server')
					.setStyle(ButtonStyle.Link)
					.setURL(makeInviteUrl(server)),
				new ButtonBuilder()
					.setCustomId('announce')
					.setLabel('Tell others')
					.setStyle(ButtonStyle.Success),
				new ButtonBuilder()
					.setCustomId('close_server')
					.setLabel('Close Server')
					.setStyle(ButtonStyle.Danger)
			);
		
		
		const serverEmbed = new EmbedBuilder()
							.setColor(0x00cc75)
							.setTitle('Server started')
							.setAuthor({ name: 'Adammantium Multiplayer Mod', iconURL: 'https://devforce.de/img/icons/AMP.png', url: 'https://www.nexusmods.com/bladeandsorcery/mods/6888' })
							.setDescription('A server has been started!')
							.addFields(
								{ name: 'Name', value: server.name },
								{ name: 'Address', value: '' + server.address, inline: true },
								{ name: "Port", value: '' + server.port, inline: true },
								{ name: "Max-Players", value: '10', inline: true },
							)
							.setTimestamp();
		
		
		await interaction.editReply({ 	content: 'Okay, server is ready! You have 2 minutes to connect, otherwise the server will get stopped and you have to execute the command again.', 
										ephemeral: true,
										embeds: [ serverEmbed ],
										components: [row]
										});
	} else {
		await interaction.editReply({ 	content: 'Something went wrong, please contact an admin!', 
										ephemeral: true,
										embeds: []
										});
	}
	
  }else if (interaction.commandName === 'invite') {
    await interaction.reply({ "content": '@', ephemeral: false });
  }
});

function makeInviteUrl(server) {
	
	return serverlistUrl + 
		   "?ip=" + encodeURI(server.address) +
		   "&port=" + encodeURI(server.port) +
		   "&name=" + encodeURI(server.name);
}

client.login(token);
