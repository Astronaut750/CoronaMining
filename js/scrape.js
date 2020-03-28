const request = require("request");
const cheerio = require("cheerio");
const xpath = require("xpath");
const dom = require("xmldom").DOMParser;
const fs = require("fs");
const { createClient } = require("webdav");

let url =
  "https://www.sozialministerium.at/Informationen-zum-Coronavirus/Neuartiges-Coronavirus-(2019-nCov).html";

let wordArray;
let date = new Date();
let tests;
let casesAustria;
let casesTirol;
let deathsAustria;
let deathsTirol;
let casesInter;
let casesChina;
let recoverInter;
let diskStationLogin = JSON.parse(fs.readFileSync("userData.json"));

const webDAVclient = createClient("http://10.0.0.11:5005", {
  username: diskStationLogin.account,
  password: diskStationLogin.password
});

function stripString1(strip) {
  strip = strip.substring(1, strip.length - 2);
  return strip;
}

function stripString2(strip) {
  strip = strip.substring(0, strip.length - 1);
  return strip;
}

function convertDateTimeFile(date) {
  date =
    date.getFullYear() +
    "-" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + date.getDate()).slice(-2) +
    "_" +
    ("0" + date.getHours()).slice(-2) +
    "-" +
    ("0" + date.getMinutes()).slice(-2) +
    "-" +
    ("0" + date.getSeconds()).slice(-2);
  return date;
}

function convertDateTimeSQL(date) {
  date =
    date.getFullYear() +
    "-" +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + date.getDate()).slice(-2) +
    " " +
    ("0" + date.getHours()).slice(-2) +
    ":" +
    ("0" + date.getMinutes()).slice(-2) +
    ":" +
    ("0" + date.getSeconds()).slice(-2);
  return date;
}

request(url, (error, response, html) => {
  if (!error && response.statusCode == 200) {
    const $ = cheerio.load(html);

    var doc = new dom({
      locator: {},
      errorHandler: {
        warning: function(w) {},
        error: function(e) {},
        fatalError: function(e) {
          console.error(e);
        }
      }
    }).parseFromString($.html());

    tests = xpath
      .select("/html/body/div[3]/div/div/div/div[2]/main/p[2]/text()", doc)
      .toString()
      .split(".")
      .join("");

    wordArray = xpath
      .select("/html/body/div[3]/div/div/div/div[2]/main/p[3]/text()", doc)
      .toString()
      .split(" ");

    casesAustria = wordArray[1].split(".").join("");

    casesTirol = stripString1(wordArray[18])
      .split(".")
      .join("");

    wordArray = xpath
      .select("/html/body/div[3]/div/div/div/div[2]/main/p[4]/text()[2]", doc)
      .toString()
      .split(" ");

    deathsAustria = stripString2(wordArray[1])
      .split(".")
      .join("");

    deathsTirol = stripString1(wordArray[16])
      .split(".")
      .join("");

    casesInter = xpath
      .select("/html/body/div[3]/div/div/div/div[2]/main/p[5]/strong[2]", doc)
      .toString()
      .substring(8, casesInter.length - 10)
      .split(".")
      .join("");

    casesChina = xpath
      .select("/html/body/div[3]/div/div/div/div[2]/main/p[5]/strong[3]", doc)
      .toString()
      .substring(8, casesChina.length - 10)
      .split(".")
      .join("");

    recoverInter = xpath
      .select("/html/body/div[3]/div/div/div/div[2]/main/p[6]/strong[2]", doc)
      .toString()
      .substring(8, recoverInter.length - 9)
      .split(".")
      .join("");
  }
});

setTimeout(function() {
  let dataCorona = {
    timestamp: convertDateTimeSQL(date).toString(),
    tests: tests.toString(),
    casesAustria: casesAustria.toString(),
    casesTirol: casesTirol.toString(),
    deathsAustria: deathsAustria.toString(),
    deathsTirol: deathsTirol.toString(),
    casesInter: casesInter.toString(),
    casesChina: casesChina.toString(),
    recoverInter: recoverInter.toString()
  };
  let dataBinary = JSON.stringify(dataCorona, null, 2);
  let filename =
    "/homes/Philipp/scrapes/scrape_" +
    convertDateTimeFile(date).toString() +
    ".json";
  console.log(filename);
  writer = webDAVclient.createWriteStream(filename);
  writer.write(dataBinary);
  writer.end();
}, 3000);
