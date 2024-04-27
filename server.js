const express = require('express');
const app = express();
const path = require('path');
const port = 3000;

// ah, it expects the dfault file to serve to be called index.html. if named otherwise you'll get cannot GET
// https://stackoverflow.com/questions/44524424/get-http-localhost3000-404-not-found
app.use("/", express.static((path.join(__dirname, ""))));

app.listen(port, () => console.log("listening on port: " + port));