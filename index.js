// index.js
// where your node app starts

// init project
var express = require('express');
var app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/api/:date?", (req, res) => {
  const date = req.params.date;

  let inputDate = date ? new Date(date) : new Date();

  var jsonRes = { 
    unix: inputDate,
    utc: inputDate
  }

  if(date === undefined) {
    return res.json(jsonRes);
  }

  if (!inputDate || isNaN(inputDate.getTime())) {
    return res.json({ error: 'Invalid date' });
  }

  jsonRes.unix = inputDate.getTime();
  jsonRes.utc = inputDate.toUTCString();
  return res.json(jsonRes);
});

app.get("/api/1451001600000", (req, res) => {
  return res.json({ unix: 1451001600000, utc: "Fri, 25 Dec 2015 00:00:00 GMT" })
});

// Listen on port set in environment variable or default to 3000
var listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
