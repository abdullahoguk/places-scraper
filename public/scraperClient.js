var searchButton = document.querySelector("button.search");
var queryInput = document.querySelector(".form .field #query");
var cityInput = document.querySelector(".form .field #city");
var zoomInput = document.querySelector(".form .field #zoom");
var limitInput = document.querySelector(".form .field #limit");

var logsListContainer = document.querySelector(".logger .logs");
var scrapedItemsContainer = document.querySelector(".results .live");
var currentPageSpan = document.querySelector(".results span.currentPage")
var currentPageIndex = document.querySelector(".results span.currentIndex");

const socket = io("/ps");

var currentSearch = {
                "query":"",
                "city":"",
                "items":[]
            };

async function main() {

    searchButton.addEventListener("click",handleSearch);
    socket.on("scrapedItem", handleScrapedItem);
    socket.on("log", handleLogItem);


    //socket.on("connect", () => socket.emit("hello", `Hi there! I am ${window.navigator.userAgent}`));
    /*
    socket.on("connect", function(){
        socket.emit("name", {"name":"ali"});
    });
*/

    socket.on("inform", function(data){
        console.log(`myId: ${data.id} - MyName: ${data.name}` )
    });

    socket.on("notify", function(data){
        console.log(`Id: ${data.id} - Name: ${data.name} joined` )
    });

    socket.on("clientmessage", function(data){
        console.info(data);
    });
/*
    socket.on("message", function(data){
        console.info(data);
    });
*/
    socket.on("scrapedItemIndex", function(data){
        updateCurrentItemIndex(data);
    });

    /*
    const secondsElement = document.getElementById("seconds");
    socket.on("seconds", seconds => secondsElement.innerText = seconds.toString());

    const welcomeElement = document.getElementById("welcome");
    socket.on("online", online => onlineElement.innerText = online.toString());

    const onlineElement = document.getElementById("online");
    socket.on("welcome", welcomeMessage => welcomeElement.innerText = welcomeMessage);
*/
    
}

main();


Object.values(cities).forEach(city => {
    document.querySelector("#city").innerHTML+=`<option value=${city.plate}>${city.name}</option>`;
});

function handleSearch(){
    if(queryInput.value == "" || cityInput.value == 0 || zoomInput.value == 0 || limitInput.value == 0){return}
    var searchData = {
        "query": queryInput.value,
        "plate": cityInput.value,
        "zoom": zoomInput.value,
        "maxPages":limitInput.value
    };
    initializeCurrentSearchObject();

    socket.emit("scrape", searchData);
    scrapedItemsContainer.innerHTML = "";
    updateCurrentItemIndex({page:"-",index:"-"})
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

    currentSearch.items.push(data);
}

function handleLogItem(data){
    var logType = data.type;
    var logContent = data.content;
    var el = document.createElement("p");
    el.dataset.logType = logType;
    el.innerHTML = logContent;
    logsListContainer.appendChild(el);
    logsListContainer.scrollTop = logsListContainer.scrollHeight;
}

function  updateCurrentItemIndex(data){
    currentPageSpan.innerText = data.page;
    currentPageIndex.innerText = data.index;
}

function initializeCurrentSearchObject(){
    currentSearch.query = queryInput.value;
    currentSearch.city = cityInput.value;
    currentSearch.items = [];
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



