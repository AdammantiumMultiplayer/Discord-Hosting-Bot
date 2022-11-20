const { address, portStart, portEnd } = require('./config.json');
const { spawn } = require('node:child_process');
const { EmbedBuilder } = require('discord.js');


var serverlist = {}

module.exports.servers = serverlist

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

module.exports.StartServer = async function(user) {
	
	var server_running = module.exports.FindServer(user.id);
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
	
	
	for(var free_port = portStart; free_port <= portEnd; free_port++) {
		if(!serverlist[free_port]) {
			break;
		}
	}
	if(free_port == portEnd) {
		return undefined;
	}
	
	console.log("Starting server on port " + free_port + " for " + user.username);
	const server_proc = spawn(
	  'mono',
	  [
		'AMP_Server.exe',
		free_port,
		'10'
	  ], {
		cwd: './serverfiles/',
		//stdio: ['inherit', 'inherit', 'inherit']
	  }
	);
	
	var entry = {
		id:	     user.id,
		name: 	 user.username + "'s Lobby",
		address: address,
		port:	 free_port,
		started: new Date(),
		process: server_proc
	};
	
	serverlist[free_port] = entry;
	
	server_proc.on('close', () => {
		if(entry.interaction) {
			entry.interaction.editReply({
				content: 'Server closed!',
				ephemeral: true,
				embeds: [ ],
				components: [ ]
			});
		}
		if(entry.announce) {
			const serverEmbed = new EmbedBuilder()
				.setColor(0x00cc75)
				.setTitle("Server closed: " + entry.name)
				.setAuthor({ name: 'Adammantium Multiplayer Mod', iconURL: 'https://devforce.de/img/icons/AMP.png', url: 'https://www.nexusmods.com/bladeandsorcery/mods/6888' })
				.setTimestamp();
			
			entry.announce.edit({
				content: 'Server closed.',
				embeds: [ serverEmbed ],
				components: [ ]
			});
		}
	});
	
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

function pidIsRunning(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch(e) {
		return false;
	}
}