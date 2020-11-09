var searchButton = document.querySelector("button.search");
var queryInput = document.querySelector(".form .field #query");
var cityInput = document.querySelector(".form .field #city");
var zoomInput = document.querySelector(".form .field #zoom");
var limitInput = document.querySelector(".form .field #limit");

var scrapedItemsContainer = document.querySelector(".results .live");


const socket = io("/googleplaces");


/** @returns {void} */
async function main() {

    searchButton.addEventListener("click",handleSearch);
    socket.on("scrapedItem", handleScrapedItem);


    //socket.on("connect", () => socket.emit("hello", `Hi there! I am ${window.navigator.userAgent}`));
    socket.on("connect", function(){
        socket.emit("name", {"name":"ali"});
    });

    socket.on("inform", function(data){
        console.log(`myId: ${data.id} - MyName: ${data.name}` )
    });

    socket.on("notify", function(data){
        console.log(`Id: ${data.id} - Name: ${data.name} joined` )
    });

    socket.on("clientmessage", function(data){
        console.info(data);
    });

    socket.on("message", function(data){
        console.info(data);
    });

   

    
    const secondsElement = document.getElementById("seconds");
    socket.on("seconds", seconds => secondsElement.innerText = seconds.toString());

    const welcomeElement = document.getElementById("welcome");
    socket.on("online", online => onlineElement.innerText = online.toString());

    const onlineElement = document.getElementById("online");
    socket.on("welcome", welcomeMessage => welcomeElement.innerText = welcomeMessage);

    


}

main();


Object.values(cities).forEach(city => {
    document.querySelector("#city").innerHTML+=`<option value=${city.plate}>${city.name}</option>`;
});

function handleSearch(){
    if(queryInput.value == "" || cityInput.value == 0 || zoomInput.value == 0 || limitInput.value == 0){return}
    var searchData = {
        "query":queryInput.value,
        "plate":cityInput.value,
        "zoom": zoomInput.value,
        "maxPages":limitInput.value
    };

    socket.emit("scrape", searchData);
}

function handleScrapedItem(data){
    var el = document.createElement("a");
    el.classList.add("item");
    el.href = data.mapsUrl;
    el.innerHTML = `
		<div class="name">${data.name}</div>
		<div class="website">${data.website}</div>
		<div class="phone">${data.tel}</div>
        <div class="address">${data.address}</div>
    `

    scrapedItemsContainer.appendChild(el);
    scrapedItemsContainer.scrollTop = scrapedItemsContainer.scrollHeight;
}


async function ajax(url) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.addEventListener("load", function () {
            try {
                resolve(this.responseText);
            } catch (error) {
                reject(error);
            }
        });
        request.open("GET", url);
        request.send();
        request.addEventListener("error", reject)
    });
}

