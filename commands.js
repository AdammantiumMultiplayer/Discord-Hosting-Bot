const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { token, clientId } = require('./config.json');

const commands = [
	new SlashCommandBuilder().setName('host').setDescription('Creates a server for you and your friends to connect to.')
		.addStringOption(option =>
			option.setName("password")
				.setDescription("Specify a password for players to be able to connect. (Default: None)")
				.setRequired(false)
		)
		.addNumberOption(option =>
			option.setName("max_players")
				.setDescription("Specify a max amount for players. (Default: 4)")
				.setRequired(false)
		),
	
	new SlashCommandBuilder().setName('invite').setDescription('Invite others to join your server.'),
	
	new SlashCommandBuilder().setName('serverlist').setDescription('Lists all the running servers.')
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers)
		.setDMPermission(false),
		
	new SlashCommandBuilder().setName('status').setDescription('Shows the status of the server.')
		.addNumberOption(option =>
			option.setName("port")
				.setDescription("Port of the server.")
				.setRequired(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers)
		.setDMPermission(false),
		
	new SlashCommandBuilder().setName('clean').setDescription('Stops servers that are running more than 2 hours.')
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers)
		.setDMPermission(false),
		
	new SlashCommandBuilder().setName('stop').setDescription('Stops specified server.')
		.addNumberOption(option =>
			option.setName("port")
				.setDescription("Port of the server.")
				.setRequired(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers)
		.setDMPermission(false)
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(Routes.applicationCommands(clientId), { body: commands });

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();