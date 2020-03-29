const uz = require("unzipper");
const fs = require("fs");
const rimraf = require("rimraf");
rimraf.sync("./CoronaMining/");
fs.mkdirSync("./CoronaMining");
fs.createReadStream("./CoronaMining.zip").pipe(
  uz.Extract({ path: "./CoronaMining/" })
);
console.log("Updated project.");
