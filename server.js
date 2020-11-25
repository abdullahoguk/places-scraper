const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const { ScrapeFactory } = require("./scraper.js");
const puppeteer = require("puppeteer");


const SERVER_PORT = process.env.PORT || 3000;

let onlineClientsCustomUrl = new Set();

// create a new express app
const app = express();
// create http server and wrap the express app
const server = http.createServer(app);
// bind socket.io to that server
const io = socketio(server);


// important! must listen from `server`, not `app`, otherwise socket.io won't function correctly
server.listen(SERVER_PORT, () =>{
	console.info(`Listening on port ${SERVER_PORT}.`)
}
);

// serve static files from a given folder
app.use(express.static("public"));


//google places scraper socket
var psSocket = io.of("/ps");
// will fire for every new websocket connection
psSocket.on("connection", psSocketConnection);

app.get("/googleplaces", (req, res) => {
	res.sendFile("./public/scraper.html", { root: __dirname });
	
});

//on google places scraper socket client connection
async function psSocketConnection(socket) {
	var username = "";
	const browser = await  openBrowser();
	console.info(`Socket ${socket.id} has connected.`);
	console.log(socket.nsp.name)

	onlineClientsCustomUrl.add(socket.id);

	var scrapeInstance = null;
	
	socket.on("disconnect", () => {
		onlineClientsCustomUrl.delete(socket.id);
		console.info(`Socket ${socket.id} has disconnected.`);
		//scrapeInstance.closeBrowser();
		//scrapeInstance.closeTab();
		browser.close();
    });
    
    socket.on("scrape", (data) => {
		//console.log(ScrapeFactory)
		if (scrapeInstance == null){
			scrapeInstance = new ScrapeFactory(socket, data.query, data.plate, data.zoom, data.maxPages,browser);
			scrapeInstance.scrape()
		}

		else{
			scrapeInstance.changeScrapeData(socket, data.query, data.plate, data.zoom, data.maxPages)
			scrapeInstance.scrape();
		}

        console.info(`Socket ${socket.id} arama isteği yolladı.`);
        //scrape(socket, data.query, data.plate, data.zoom, data.maxPages);
	});


	//send a message to everyone
	//this.emit("message", "a person joined");
}

async function openBrowser(){
	var headless = false;

	return  await puppeteer.launch({
		headless: headless,
		args: ["--disable-setuid-sandbox", "--no-sandbox",],
		ignoreHTTPSErrors: true,
	});
}
