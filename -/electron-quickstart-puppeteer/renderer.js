// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const puppeteer = require("puppeteer");
const fs = require("fs");
const util = require("util");
const jsonexport = require("jsonexport");
const { cities } = require("./data.js");
var customData = require('electron').remote.getGlobal('customData')

//console.log(customData.sysDocs);
console.log(getChromiumExecPath())


const delay = util.promisify(setTimeout);

var headless = false;
var places = [];

var searchButton = document.querySelector("button.search");
var queryInput = document.querySelector(".form .field #query");
var cityInput = document.querySelector(".form .field #city");
var zoomInput = document.querySelector(".form .field #zoom");
var limitInput = document.querySelector(".form .field #limit");
var spanCurrentPage = document.querySelector(".currentPage");
var spanCurrentIndex = document.querySelector(".currentIndex");

var scrapedItemsContainer = document.querySelector(".results .live");


Object.values(cities).forEach(city => {
    document.querySelector("#city").innerHTML+=`<option value=${city.plate}>${city.name}</option>`;
});

searchButton.addEventListener("click",handleSearch )

function handleSearch(){
    if(queryInput.value == "" || cityInput.value == 0 || zoomInput.value == 0 || limitInput.value == 0){return}
    var searchData = {
        "query":queryInput.value,
        "plate":cityInput.value,
        "zoom": zoomInput.value,
        "maxPages":limitInput.value
    };
    scrape(searchData)
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


async function scrape({query, plate, zoom, maxPages}) {
    var query = query.split(" ").join("+");
    var lat = cities[plate].lat;
    var lon = cities[plate].lon;
	let url = `https://www.google.com/maps/search/${query}/@${lat},${lon},${zoom}z`;
	const browser = await puppeteer.launch({
		headless: headless,
		args: ["--disable-setuid-sandbox"],
		ignoreHTTPSErrors: true,
        executablePath: getChromiumExecPath()
	});
	var currentPage = 1;

	//const page = await retry(() => browser.newPage());
	const page = await browser.newPage();
	await page.goto(url);
	await page.waitForSelector(".widget-expand-button-pegman-icon");
	//scrape pages
	while (currentPage <= maxPages) {
		var pagePlaces = [];
		//await page.waitForSelector('.section-layout .section-result');
		await retry(() => page.waitForSelector(".section-layout .section-result"));

		var pageResultItems = await page.$$(".section-result");
		var numberOfItems = pageResultItems.length;

		for (let index = 1; index <= numberOfItems; index++) {
			console.log("Sayfa:" + currentPage + " Eleman:" + index);
            spanCurrentPage.innerHTML = currentPage;
            spanCurrentIndex.innerHTML = index;
			await page.waitForSelector(
				`.section-layout .section-result[data-result-index='${index}']`
			);
			await page.click(
				`.section-layout .section-result[data-result-index='${index}']`
			);

			//await page.waitForSelector("button[aria-label='Yorum yazın']");
			await retry(() =>
				page.waitForSelector("button[aria-label='Yorum yazın']")
			);

			//await timeout(500);
			await page.waitForTimeout(500);
			const data = await page.evaluate(async function () {
				var currentItem = {};
				//document.querySelector("button[aria-label='Adresi kopyala']")
				currentItem.name = (await document.querySelector(
					".section-hero-header-title-description h1"
				))
					? document.querySelector(".section-hero-header-title-description h1")
							.innerText
					: " ";
				currentItem.address = (await document.querySelector(
					`button[data-item-id='address']`
				))
					? document
							.querySelector(`button[data-item-id='address']`)
							.getAttribute("aria-label")
							.substr(7)
							.trim()
					: " ";
				currentItem.website = (await document.querySelector(
					`button[data-item-id='authority']`
				))
					? document
							.querySelector(`button[data-item-id='authority']`)
							.getAttribute("aria-label")
							.substr(11)
							.trim()
					: " ";
				currentItem.tel = (await document.querySelector(
					`button[data-tooltip='Telefon numarasını kopyala']`
				))
					? document
							.querySelector(
								`button[data-tooltip='Telefon numarasını kopyala']`
							)
							.getAttribute("aria-label")
							.substr(8)
							.trim()
					: " ";
				currentItem.mapsUrl = await window.location.href;
				currentItem.openHours = (await document.querySelector(
					".section-open-hours-container"
				))
					? document
							.querySelector(".section-open-hours-container")
							.getAttribute("aria-label")
							.slice(0, -34)
							.trim()
					: " ";
				currentItem.category = (await document.querySelector(
					`button[jsaction='pane.rating.category']`
				))
					? document.querySelector(`button[jsaction='pane.rating.category']`)
							.innerText
					: " ";
				currentItem.rating = (await document.querySelector(
					"span.section-star-display"
				))
					? document.querySelector("span.section-star-display").innerText
					: " ";

				return currentItem;
			});

			pagePlaces.push(data);
            console.log(JSON.stringify(data));

            handleScrapedItem(data)


			await page.waitForTimeout(1000);
			//await page.goBack();
			await page.click("button.section-back-to-list-button");
			//await page.waitForNavigation({ waitUntil: 'domcontentloaded'})

			await page.waitForTimeout(1000);
		}

		places = [...places, ...pagePlaces];
		currentPage++;
		await page.waitForSelector("button[aria-label='Sonraki sayfa']");

		var isEnd = await page.$eval("button[aria-label='Sonraki sayfa']", (el) =>
			el.getAttribute("disabled")
		);
		console.log("isEnd: " + isEnd);
		if (isEnd == true) {
			console.log("STOP IT");
			currentPage = maxPages + 1;
			break;
		} else {
			//await page.click("button[aria-label='Sonraki sayfa']");
			await page.evaluate(() => {
				document.querySelector("button[aria-label='Sonraki sayfa']").click();
			});
			await page.waitForTimeout(2000);
		}
		//await timeout(3000);

		console.log(pagePlaces);
		console.log("isMax: " + currentPage <= maxPages);
	}

	await browser.close();

	var csvPlaces = "";
	jsonexport(places, function (err, csv) {
		if (err) return console.error(err);
		csvPlaces = csv;
	});

	fs.writeFile(`${customData.sysDocs}/${query}.csv`, csvPlaces, () => {
		console.log("CSV Dosyaya yazıldı");
	});

	fs.writeFile(`${customData.sysDocs}/${query}.json`, JSON.stringify(places), () => {
		console.log("JSON Dosyaya yazıldı");
	});
}

async function retry(promiseFactory, retryCount = 3) {
	try {
		return await promiseFactory();
	} catch (error) {
		if (retryCount <= 0) {
			throw error;
		}
		return await retry(promiseFactory, retryCount - 1);
	}
}


function getChromiumExecPath() {
  return puppeteer.executablePath().replace('app.asar', 'app.asar.unpacked');
}



