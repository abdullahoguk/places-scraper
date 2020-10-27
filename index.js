const puppeteer = require('puppeteer');

var query = "nalbur";
var lat = "40.8416102"
var long = "31.1428242";
var zoom = "14";
var maxPages = 5;

var places = [];

async function scrape(query, lat, long, zoom) {

    let url = `https://www.google.com/maps/search/${query}/@${lat},${long},${zoom}z`
    const browser = await puppeteer.launch({
        headless: false,
        args: ["--disable-setuid-sandbox"],
        'ignoreHTTPSErrors': true
    });
    var currentPage = 0;



    const page = await browser.newPage();
    await page.goto(url);

    //scrape pages
    while (currentPage <= maxPages) {
        
        await page.waitForSelector('.section-layout .section-result');

        const data = await page.evaluate(async function () {
            var isEnd = false;
            var pagePlaces = [];
            const results = document.querySelectorAll(".section-layout .section-result");
            results.forEach(function (result) {
                var obj = {};
                obj.name = result.querySelector(".section-result-title span").innerText.trim();
                obj.shortAdress = result.querySelector(".section-result-location").innerText.trim();
                obj.tel = result.querySelector(".section-result-phone-number span").innerText.trim();
                pagePlaces.push(obj);
            })
            if(document.querySelector("button[aria-label='Sonraki sayfa']")){
                document.querySelector("button[aria-label='Sonraki sayfa']").click();
            }

            else{
                isEnd=true;
            }

            return [pagePlaces,isEnd];
        });
        
        places = [...places, ...data[0]];
        currentPage++;
        if(data[1]==true){
            break;
        }
    }

    console.log(places,places.length);    

    await browser.close();
}

scrape(query, lat, long, zoom, maxPages);