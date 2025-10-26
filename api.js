const express = require('express');
const { token, clientId, serverlistUrl, default_version, address, max_servers } = require('./config.json');
const { servers, StartServer, StopServer, FindServer, CleanServers } = require("./server_handler");
const { versions, beta_versions } = require("./versions");
const fetch = require('node-fetch');

const app = express();

const port = 3000;

function check_filter(search) {
    var result = versions.filter(obj => {
        return obj.value == search
    });
    if(result.length == 1) return result[0];


    var result = beta_versions.filter(obj => {
        return obj.value == search
    });
    console.log(result);
    if(result.length == 1) return result[0];

    return {};
}

function get_version_to_run(version) {
    console.log("Checking version " + version);

    var result = check_filter(version);
    if(result.value) return result.value;

    result = check_filter(version.replaceAll(" ", ""));
    if(result.value) return result.value;

    if(version.indexOf("-") > 0) {
        result = check_filter(version.replaceAll(" ", "").split("-")[0]);
        if(result.value) return result.value;
    }

    return default_version;
}

async function request_join_code(server) {

    const body = {
        "address": server.address,
        "port": server.port
    };

    const response = await fetch(`${serverlistUrl}/ping/join_code.php`, {
        method: 'post',
        body: JSON.stringify(body),
        headers: {'Content-Type': 'application/json'}
    });
    const data = await response.json();

    return data.ok;
}

app.listen(port, () => {
   console.log(`API running on ${port}`)
});
app.get('/status', async (req, res) => {
   console.log("Servers running: " + Object.keys(servers).length + " / " + max_servers);
});

app.get('/run_server', async (req, res) => {
    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress

    var map = undefined;
    var mode = undefined;
    if(req.query.map && req.query.mode) {
        map = req.query.map;
        mode = req.query.mode;
    }

    // If we don't know the version, just exit
    /*if(!req.query.version) {
        res.send("0");
        return;
    }*/

    if(Object.keys(servers).length > max_servers) {
        res.send("The server is currently overloaded. Please try again later.");
        return;
    }

    var version = get_version_to_run(req.query.version);


    var fakeUser = { id: ip, username: ip }

    var server = await StartServer(fakeUser, 10, "", version, true, map, mode);

    var join_code = await request_join_code(server);

    if(join_code && join_code != false) {
        res.send(join_code);
    }else{
        res.send("0");
    }
});
