const { address, portStart, portEnd } = require('./config.json');
const { spawn, execFile } = require('node:child_process');
const { EmbedBuilder } = require('discord.js');


var serverlist = {}

module.exports.servers = serverlist

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function randomRange(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

module.exports.StartServer = async function(user, max_players, passphrase, version, pvp_enabled, map, mode) {
	var server_running = false;
	// TODO Limit IP when user.id is not set
	if(user && user.id) server_running = module.exports.FindServer(user.id);
	if(server_running) {
		if(!pidIsRunning(server_running.process.pid)) {
			if(serverlist.hasOwnProperty(server_running.port)) {
				delete serverlist[server_running.port];
				
				console.log("Server died and cleaned up");
			}else{
				console.log("Server died");
			}
		} else {
			console.log("Server running already");
		
			return server_running;
		}
	}
	
	var use_port = -1;
	for(var try_count = 0; try_count < 10; try_count++) {
		var port = randomRange(portStart, portEnd);
		if(!serverlist[port]) {
			use_port = port;
			break;
		}
	}
	
	if(use_port < 0) {
		for(var free_port = portStart; free_port <= portEnd; free_port++) {
			if(!serverlist[free_port]) {
				use_port = free_port;
				break;
			}
		}
		if(use_port == portEnd) {
			return undefined;
		}
	}
	
	if(!passphrase) passphrase = "";
	
	if(user)
		console.log("Starting server on port " + use_port + " for " + user.username);
	else
		console.log("Starting server on port " + use_port + " for API call");
	
	parameters = [
		'--debug',
		'AMP_Server.exe',
		'-port', use_port,
		'-max_players', max_players,
		'-password', passphrase,
		'-pvp', pvp_enabled
	]
	if(map && mode) {
		parameters.push("-map");
		parameters.push(map);
		parameters.push("-mode");
		parameters.push(mode);
	}
	console.log(parameters);
	const server_proc = execFile(
		'mono',
		parameters, {
			//detached: true,
			cwd: './serverfiles/' + version + "/",
			//stdio: ['inherit', 'inherit', 'inherit']
		}
	);
	
	var entry = {
		id:	     	 (user ? user.id : ""),
		name: 	 	 (user ? user.username : "API") + "'s Lobby",
		address: 	 address,
		port:	 	 use_port,
		max_players: max_players,
		started: 	 new Date(),
		process: 	 server_proc,
		passphrase:  (passphrase ? "🔒" : ""),
		version:	 version,
		pvp:		 pvp_enabled
	};
	
	serverlist[use_port] = entry;
	
	server_proc.on('close', async () => {
		try {
			if(entry.interaction) {
				await entry.interaction.editReply({
					content: 'Server closed!',
					ephemeral: true,
					embeds: [ ],
					components: [ ]
				});
			}
		}catch(error){
			console.error(error);
		}
		
		
		try {
			if(entry.announce) {
				const serverEmbed = new EmbedBuilder()
					.setColor(0x00cc75)
					.setTitle("Server closed: " + entry.name)
					.setAuthor({ name: 'Adammantium Multiplayer Mod', iconURL: 'https://devforce.de/img/icons/AMP.png', url: 'https://www.nexusmods.com/bladeandsorcery/mods/6888' })
					.setTimestamp();
				
				await entry.announce.edit({
					content: 'Server closed.',
					embeds: [ serverEmbed ],
					components: [ ]
				});
			}
		}catch(error){
			console.error(error);
		}
		
		
		await sleep(10000);
		
		
		try {
			if(entry.interaction) {
				await entry.interaction.deleteReply();
			}
		}catch(error){
			console.error(error);
		}
		try {
			if(entry.announce) {
				await entry.announce.delete();
			}
		}catch(error){
			console.error(error);
		}
		
		
		if(serverlist.hasOwnProperty(entry.port)) {
			delete serverlist[entry.port];
			
			console.log("Server \"" + entry.name + "\" closed.");
		}
	});
	
	//server_proc.unref();
	
	return entry;
};

module.exports.StopServer = async function(user) {
	var server_running = module.exports.FindServer(user.id);
	if(server_running) {
		if(!pidIsRunning(server_running.process.pid)) {
			console.log("Server already died");
		}else{
			server_running.process.kill('SIGINT');
		}
		
		if(serverlist.hasOwnProperty(server_running.port)) {
			delete serverlist[server_running.port];
			
			console.log("Server for user " + user.username + " closed.");
		}
	}
}

module.exports.FindServer = function(id) {
	var found = undefined;
	Object.keys(serverlist).forEach(port => {
		if(found) return false;
		if(serverlist[port].id == id) found = serverlist[port];
	});
	return found;
}

module.exports.CleanServers = function() {
	let cleaned = 0;
	Object.keys(serverlist).forEach(port => {
		let server = serverlist[port];
		
		if(!pidIsRunning(server.process.pid)) {
			if(serverlist.hasOwnProperty(server.port)) {
				delete serverlist[server.port];
			}
			console.log("Server died - " + server.name + " (" + server.address + ")");
			cleaned++;
		}
	});
	return cleaned;
}

function pidIsRunning(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch(e) {
		return false;
	}
}
