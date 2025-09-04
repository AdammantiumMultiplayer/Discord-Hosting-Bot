const express = require('express');
const { token, clientId, serverlistUrl, default_version, address } = require('./config.json');
const { servers, StartServer, StopServer, FindServer, CleanServers } = require("./server_handler");
const fetch = require('node-fetch');

const app = express();

const port = 3000;

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

app.get('/run_server', async (req, res) => {
    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress

    var fakeUser = { id: ip, username: ip }

    var server = await StartServer(fakeUser, 10, "", default_version, true);

    var join_code = await request_join_code(server);

    if(join_code && join_code != false) {
        res.send(join_code);
    }else{
        res.send("0");
    }
});
