const uz = require("unzipper");
const fs = require("fs");
fs.createReadStream("./zip/test.zip").pipe(
  uz.Extract({ path: "./zip/Extract/" })
);
