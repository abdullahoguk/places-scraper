const puppeteer = require('puppeteer');

var query = "ajans";
var lat = "40.8416102"
var long = "31.1428242";
var zoom = "14";
var maxPages = 2;

var places = [];


scrape(query, lat, long, zoom, maxPages);

//scrape 2
async function scrape(query, lat, long, zoom) {

    let url = `https://www.google.com/maps/search/${query}/@${lat},${long},${zoom}z`
    const browser = await puppeteer.launch({
        headless: false,
        args: ["--disable-setuid-sandbox"],
        'ignoreHTTPSErrors': true
    });
    var currentPage = 1;



    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForSelector('.widget-expand-button-pegman-icon');
    //scrape pages
    while (currentPage <= maxPages) {
        var pagePlaces = [];
        await page.waitForSelector('.section-layout .section-result');
        var pageResultItems = await page.$$(".section-result");
        var numberOfItems = pageResultItems.length;


        

        for (let index = 1; index <= numberOfItems; index++) {
            console.log("Sayfa:" + currentPage + " Eleman:" + index);
            await page.waitForSelector(`.section-layout .section-result[data-result-index='${index}']`);
            await page.click(`.section-layout .section-result[data-result-index='${index}']`);
            
            await page.waitForSelector("button[aria-label='Yorum yazın']");
            

            //await timeout(500);
            await page.waitForTimeout(1000);
            const data = await page.evaluate(async function () {
                var currentItem = {};
                //document.querySelector("button[aria-label='Adresi kopyala']")
                currentItem.adress = await document.querySelector(`button[data-item-id='address']`) ? document.querySelector(`button[data-item-id='address']`).getAttribute("aria-label") :"";
                currentItem.website = await document.querySelector(`button[data-item-id='authority']`) ? document.querySelector(`button[data-item-id='authority']`).getAttribute("aria-label") :"";
                currentItem.tel = await document.querySelector(`button[data-tooltip='Telefon numarasını kopyala']`) ? document.querySelector(`button[data-tooltip='Telefon numarasını kopyala']`).getAttribute("aria-label") :"";
                currentItem.mapsUrl = await window.location.href;
                currentItem.openHours = await document.querySelector(".section-open-hours-container") ? document.querySelector(".section-open-hours-container").getAttribute("aria-label") : "";
                currentItem.category = await document.querySelector(`button[jsaction='pane.rating.category']`) ? document.querySelector(`button[jsaction='pane.rating.category']`).innerText : "";
                currentItem.rating = await document.querySelector("span.section-star-display") ? document.querySelector("span.section-star-display").innerText : "";

                
                /*
                await navigator.clipboard.readText()
                .then(text => {
                    adress = text;
                }).catch(err => {console.log('error on clipboard', err);});*/       
    
                return currentItem;
            });

            pagePlaces.push(data);

            //await waitTillHTMLRendered(page)
           // await     page.waitForNavigation({ waitUntil: 'domcontentloaded' })

           await page.waitForTimeout(2000);
            //await page.goBack();
            await page.click("button.section-back-to-list-button");
            //await page.waitForNavigation({ waitUntil: 'domcontentloaded'})


            //await timeout(500);
           // await waitTillHTMLRendered(page)

           await page.waitForTimeout(2000);

        }

        
        
        places = [...places, ...pagePlaces];
        currentPage++;
        await page.waitForSelector("button[aria-label='Sonraki sayfa']");
        
        var isEnd = await page.$eval("button[aria-label='Sonraki sayfa']", el => el.getAttribute("disabled"))
        console.log("isEnd: " + isEnd);
        if(isEnd==true){
            console.log("STOP IT");
            currentPage = maxPages+1;
            break;
        }
        else{
            //await page.click("button[aria-label='Sonraki sayfa']");
            await page.evaluate(() => {
                document.querySelector("button[aria-label='Sonraki sayfa']").click();
            });
            await page.waitForTimeout(3000);
        }
        //await page.waitForNavigation();
        //await timeout(3000);
        //await page.waitForNavigation({ waitUntil: 'domcontentloaded' })
        //await waitTillHTMLRendered(page)



        console.log(pagePlaces);
        console.log("isMax: " + currentPage <= maxPages);

    }

    //console.log(places,places.length);    

    await browser.close();
}

function timeout(ms) { //pass a time in milliseconds to this function
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const waitTillHTMLRendered = async (page, timeout = 30000) => {
    const checkDurationMsecs = 1000;
    const maxChecks = timeout / checkDurationMsecs;
    let lastHTMLSize = 0;
    let checkCounts = 1;
    let countStableSizeIterations = 0;
    const minStableSizeIterations = 3;
  
    while(checkCounts++ <= maxChecks){
      let html = await page.content();
      let currentHTMLSize = html.length; 
  
      let bodyHTMLSize = await page.evaluate(() => document.body.innerHTML.length);
  
      console.log('last: ', lastHTMLSize, ' <> curr: ', currentHTMLSize, " body html size: ", bodyHTMLSize);
  
      if(lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize) 
        countStableSizeIterations++;
      else 
        countStableSizeIterations = 0; //reset the counter
  
      if(countStableSizeIterations >= minStableSizeIterations) {
        console.log("Page rendered fully..");
        break;
      }
  
      lastHTMLSize = currentHTMLSize;
      await page.waitFor(checkDurationMsecs);
    }  
  };
/*
//scrape1
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
    while (currentPage < maxPages) {
        
        await page.waitForSelector('.section-layout .section-result');
console.log(page.$$(".section-result"));
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

    //console.log(places,places.length);    

    await browser.close();
}

*/