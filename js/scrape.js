const request = require("request");
const cheerio = require("cheerio");
const xpath = require("xpath");
const dom = require("xmldom").DOMParser;
const fs = require("fs");
const { createClient } = require("webdav");

let date = new Date();

let url =
  "https://www.sozialministerium.at/Informationen-zum-Coronavirus/Neuartiges-Coronavirus-(2019-nCov).html";

let tests;

let wordArray;
let casesAustria;
let casesTirol;

let deathsAustria;
let deathsTirol;

let recover;

let casesInter;
let casesChina;

let recoverInter;

let diskStationLogin = JSON.parse(
  fs.readFileSync(__dirname + "/../login/diskStationLogin.json")
);

const webDAVclient = createClient("http://10.0.0.11:5005", {
  username: diskStationLogin.account,
  password: diskStationLogin.password
});

function removeDots(word) {
  return word.split(".").join("");
}

function removeParentheses(word, pre, suf) {
  return word.substring(pre, word.length - suf);
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

    // 1
    tests = removeDots(
      xpath.select1(
        "/html/body/div[3]/div/div/div/div[2]/main/p[2]/text()",
        doc
      ).data
    );

    wordArray = xpath
      .select1("/html/body/div[3]/div/div/div/div[2]/main/p[3]/text()", doc)
      .data.split(" ");

    // 2
    casesAustria = removeDots(wordArray[1]);

    // 3
    casesTirol = removeDots(wordArray[18]);
    casesTirol = removeParentheses(casesTirol, 1, 2);

    wordArray = xpath
      .select1("/html/body/div[3]/div/div/div/div[2]/main/p[4]/text()[2]", doc)
      .data.split(" ");

    // 4
    deathsAustria = removeDots(wordArray[1]);

    // 5
    deathsTirol = removeDots(wordArray[16]);
    deathsTirol = removeParentheses(deathsTirol, 1, 2);

    // 6
    recover = removeDots(
      xpath.select1(
        "/html/body/div[3]/div/div/div/div[2]/main/p[5]/text()",
        doc
      ).data
    );
    recover = removeParentheses(recover, 2, 0);

    // 7
    casesInter = null;

    // 8
    casesChina = null;

    // 9
    recoverInter = null;
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
    recover: recover.toString(),
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
