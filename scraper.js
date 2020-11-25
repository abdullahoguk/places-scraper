const puppeteer = require("puppeteer");
const fs = require("fs");
const util = require("util");
const jsonexport = require("jsonexport");
const { cities } = require("./data.js");

const delay = util.promisify(setTimeout);

var headless = false;
var places = [];

function ScrapeFactory(socket, query,plate, zoom,maxPages,browser) {
	this.socket = socket;
    this.query = query.split(" ").join("+");
    this.lat = cities[plate].lat;
	this.lon = cities[plate].lon;
	this.zoom = zoom;
	this.url = `https://www.google.com/maps/search/${this.query}/@${this.lat},${this.lon},${this.zoom}z`;
	
	this.currentPage = 1;
	this.maxPages= maxPages;

	this.scrape=scrape;
	this.changeScrapeData = changeScrapeData;
	this.closeTab = closeTab;
	this.closeBrowser = closeBrowser;

	this.browser = browser;
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

async function scrape(){
/*
	if(this.browser)
	this.closeBrowser();
	this.browser =  await puppeteer.launch({
		headless: headless,
		args: ["--disable-setuid-sandbox"],
		ignoreHTTPSErrors: true,
	});
*/

	this.page = await retry(() => this.browser.newPage());
	//const page = await browser.newPage()
	await this.page.goto(this.url);
	await this.page.waitForSelector(".widget-expand-button-pegman-icon");
	//scrape pages
	while (this.currentPage <= this.maxPages) {
		var pagePlaces = [];
		//await page.waitForSelector('.section-layout .section-result');
		await retry(() => this.page.waitForSelector(".section-layout .section-result"));

		var pageResultItems = await this.page.$$(".section-result:not([data-result-ad-type])");
		var numberOfItems = pageResultItems.length;

		for (let index = 1; index <= numberOfItems; index++) {
			console.log("Sayfa:" + this.currentPage + " Eleman:" + index);
			await this.page.waitForSelector(
				`.section-layout .section-result[data-result-index='${index}']`
			);
			await this.page.click(
				`.section-layout .section-result[data-result-index='${index}']`
			);

			//await page.waitForSelector("button[aria-label='Yorum yazın']");
			await retry(() =>
			this.page.waitForSelector("button[aria-label='Yorum yazın']")
			);

			//await timeout(500);
			await this.page.waitForTimeout(500);
			const data = await this.page.evaluate(async function () {
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
			this.socket.emit("scrapedItem", data);
			this.socket.emit("scrapedItemIndex", {page:this.currentPage, index});

			await this.page.waitForTimeout(1000);
			//await page.goBack();
			await this.page.click("button.section-back-to-list-button");
			//await page.waitForNavigation({ waitUntil: 'domcontentloaded'})
			await this.page.waitForTimeout(1000);
		}

		places = [...places, ...pagePlaces];
		this.currentPage++;
		await this.page.waitForSelector("button[aria-label='Sonraki sayfa']");

		var isEnd = await this.page.$eval("button[aria-label='Sonraki sayfa']", (el) =>
			el.getAttribute("disabled")
		);
		console.log("isEnd: " + isEnd);
		if (isEnd == true) {
			console.log("STOP IT");
			this.currentPage = this.maxPages + 1;
			break;
		} else {
			//await page.click("button[aria-label='Sonraki sayfa']");
			await this.page.evaluate(() => {
				document.querySelector("button[aria-label='Sonraki sayfa']").click();
			});
			await this.page.waitForTimeout(2000);
		}
		//await timeout(3000);

		console.log(pagePlaces);
		console.log("isMax: " + this.currentPage <= this.maxPages);
	}
//this.closeBrowser()
this.closeTab();

	var csvPlaces = "";
	jsonexport(places, function (err, csv) {
		if (err) return console.error(err);
		csvPlaces = csv;
	});

	fs.writeFile(`./public/scrapedData/${this.query}.csv`, csvPlaces, () => {
		console.log("CSV Dosyaya yazıldı");
	});

	fs.writeFile(`./public/scrapedData/${this.query}.json`, JSON.stringify(places), () => {
		console.log("JSON Dosyaya yazıldı");
	});
}

async function changeScrapeData(socket, query,plate, zoom,maxPages) {
	this.socket = socket;
	this.query = query.split(" ").join("+");
	console.log(cities[plate].lat)

    this.lat = cities[plate].lat;
    this.lon = cities[plate].lon;
	this.url = `https://www.google.com/maps/search/${this.query}/@${this.lat},${this.lon},${this.zoom}z`;

	//TODO 	close browser

	await this.closeTab();
	// reset data
	/*
	this.browser = await puppeteer.launch({
		headless: headless,
		args: ["--disable-setuid-sandbox"],
		ignoreHTTPSErrors: true,
	});
	*/
	this.currentPage = 1;
	this.maxPages= maxPages;
	
}

async function closeBrowser(){
	await this.closeTab();
	await this.browser.close();
}

async function closeTab(){
	await this.page.close();
}





module.exports = {ScrapeFactory};


