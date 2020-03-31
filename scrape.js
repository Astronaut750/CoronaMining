const request = require("request");
const cheerio = require("cheerio");
const xpath = require("xpath");
const dom = require("xmldom").DOMParser;
const fs = require("fs");
const { createClient } = require("webdav");

let date = new Date();

let url =
  "https://www.sozialministerium.at/Informationen-zum-Coronavirus/Neuartiges-Coronavirus-(2019-nCov).html";

let tests,
  wordArray,
  casesAustria,
  casesTirol,
  deathsAustria,
  deathsTirol,
  recoverAustria,
  recoverTirol,
  casesInter,
  recoverInter;

let diskStationLogin = JSON.parse(
  fs.readFileSync(__dirname + "/diskStationLogin.json")
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
    deathsAustria = removeParentheses(deathsAustria, 0, 1);

    // 5
    deathsTirol = removeDots(wordArray[16]);
    deathsTirol = removeParentheses(deathsTirol, 1, 2);

    wordArray = xpath
      .select1("/html/body/div[3]/div/div/div/div[2]/main/p[5]/text()", doc)
      .data.split(" ");

    // 6
    recoverAustria = removeDots(wordArray[1]);
    recoverAustria = removeParentheses(recoverAustria, 0, 1);

    // 7
    recoverTirol = removeDots(wordArray[16]);
    recoverTirol = removeParentheses(recoverTirol, 1, 2);

    // 8
    casesInter = removeDots(
      xpath.select1(
        "/html/body/div[3]/div/div/div/div[2]/main/p[6]/strong[2]",
        doc
      ).childNodes[0].data
    );
    casesInter = removeParentheses(casesInter, 0, 1);

    // 9
    recoverInter = removeDots(
      xpath.select1(
        "/html/body/div[3]/div/div/div/div[2]/main/p[7]/strong[2]",
        doc
      ).childNodes[0].data
    );
  }
});

setTimeout(function() {
  let dataCorona = {
    timestamp: convertDateTimeSQL(date).toString(),
    tests: tests,
    casesAustria: casesAustria,
    casesTirol: casesTirol,
    deathsAustria: deathsAustria,
    deathsTirol: deathsTirol,
    recoverAustria: recoverAustria,
    recoverTirol: recoverTirol,
    casesInter: casesInter,
    recoverInter: recoverInter
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
}, 5000);
