
const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const SERVER_PORT = process.env.PORT || 3000;

let nextVisitorNumber = 1;
let onlineClients = new Set();
let onlineClientsCustomUrl = new Set();


function psSocketConnection(socket) {
    var username = "";
    console.info(`Socket ${socket.id} has connected.`);
    onlineClientsCustomUrl.add(socket.id);

    socket.on("disconnect", () => {
        onlineClientsCustomUrl.delete(socket.id);
        console.info(`Socket ${socket.id} has disconnected.`);
    });

    
    // echoes on the terminal every "hello" message this socket sends
    socket.on("hello", helloMsg => console.info(`Socket ${socket.id} says: "${helloMsg}"`));

    // will send a message only to this socket (different than using `io.emit()`, which would broadcast it)
    socket.emit("welcome", `Welcome! You are visitor number ${nextVisitorNumber++}`);


    socket.on("name", function(data) {
        username=data.name;
        socket.emit("inform", {"name":data.name, "id": socket.id });
        socket.broadcast.emit("notify", {name:username, id: socket.id, joined:true });
    });


    //send a message to everyone
    this.emit("message", "a person joined");

    socket.on("clientmessage", data =>{
        socket.broadcast.emit("clientmessage", `Socket ${socket.id} says: ${data}`);
    }); 
}



    // create a new express app
    const app = express();
    // create http server and wrap the express app
    const server = http.createServer(app);
    // bind socket.io to that server
    const io = socketio(server);
    let secondsSinceServerStarted = 0;
    
    //google places scraper socket
    var psSocket = io.of("/googleplaces")

    app.get("/googleplaces", (req, res) => {
        res.sendFile('./public/scraper.html', { root: __dirname })
        
        // will fire for every new websocket connection
        psSocket.on("connection", psSocketConnection);

        // will send one message per second to all its clients
   
    });

    // example on how to serve static files from a given folder
    app.use(express.static("public"));

    

    // important! must listen from `server`, not `app`, otherwise socket.io won't function correctly
    server.listen(SERVER_PORT, () => console.info(`Listening on port ${SERVER_PORT}.`));
    io.of("/").on("connection", rootSocketConnection);



    setInterval(() => {
        secondsSinceServerStarted++;

        psSocket.emit("seconds", secondsSinceServerStarted);
        psSocket.emit("online", onlineClientsCustomUrl.size);
        psSocket.emit("message", "to scraper ns");

        io.of("/").emit("seconds", secondsSinceServerStarted);

        io.of("/").emit("online", onlineClients.size);

        io.of("/").emit("message", "to root");


    }, 1000);



function generateRandomNumber() {
    return (Math.floor(Math.random() * 1000)).toString();
}

function rootSocketConnection(socket) {
    var username = "";
    console.info(`Socket ${socket.id} has connected.`);
    onlineClients.add(socket.id);

    socket.on("disconnect", () => {
        onlineClients.delete(socket.id);
        console.info(`Socket ${socket.id} has disconnected.`);
    });

    
    // echoes on the terminal every "hello" message this socket sends
    socket.on("hello", helloMsg => console.info(`Socket ${socket.id} says: "${helloMsg}"`));

    // will send a message only to this socket (different than using `io.emit()`, which would broadcast it)
    socket.emit("welcome", `Welcome! You are visitor number ${nextVisitorNumber++}`);


    socket.on("name", function(data) {
        username=data.name;
        socket.emit("inform", {"name":data.name, "id": socket.id });
        socket.broadcast.emit("notify", {name:username, id: socket.id, joined:true });
    });


    //send a message to everyone
    this.emit("message", "a person joined");

    socket.on("clientmessage", data =>{
        socket.broadcast.emit("clientmessage", `Socket ${socket.id} says: ${data}`);
    }); 
}

