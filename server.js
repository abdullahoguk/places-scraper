const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const { scrape } = require("./scraper.js");

const SERVER_PORT = process.env.PORT || 3000;

let onlineClientsCustomUrl = new Set();

// create a new express app
const app = express();
// create http server and wrap the express app
const server = http.createServer(app);
// bind socket.io to that server
const io = socketio(server);

// important! must listen from `server`, not `app`, otherwise socket.io won't function correctly
server.listen(SERVER_PORT, () =>
	console.info(`Listening on port ${SERVER_PORT}.`)
);

// serve static files from a given folder
app.use(express.static("public"));

//google places scraper socket
var psSocket = io.of("/googleplaces");

app.get("/googleplaces", (req, res) => {
	res.sendFile("./public/scraper.html", { root: __dirname });

	// will fire for every new websocket connection
	psSocket.on("connection", psSocketConnection);
});

//on google places scraper socket client connection
function psSocketConnection(socket) {
	var username = "";
	console.info(`Socket ${socket.id} has connected.`);
	onlineClientsCustomUrl.add(socket.id);

	socket.on("disconnect", () => {
		onlineClientsCustomUrl.delete(socket.id);
		console.info(`Socket ${socket.id} has disconnected.`);
    });
    
    socket.on("scrape", (data) => {
        console.info(`Socket ${socket.id} arama isteği yolladı.`);
        scrape(socket, data.query, data.plate, data.zoom, data.maxPages);
	});


	//send a message to everyone
	//this.emit("message", "a person joined");
}