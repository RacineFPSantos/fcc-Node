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

//Timestamp Microservice
const isDateValid = (date) => date.toUTCString() === 'Invalid Date';
app.get("/api/:date?", (req, res) => {  
  if(req.params.date === undefined || 
    req.params.date === null || 
    req.params.date === '') {
    return res.json({ 
      unix: Date.now(),
      utc: Date.now()
    })
  }

  var inputDate = new Date(req.params.date);

  if(isDateValid(inputDate)) {
    inputDate = new Date(Number(req.params.date));
  }

  if(isDateValid(inputDate)) {
    return res.json({ error: 'Invalid date' });    
  }

  return res.json({ 
    unix: inputDate.getTime(),
    utc: inputDate.toUTCString()
  });
});

//Request Header Parser Microservice
app.get('/api/whoami', function (req, res) {
  res.json({ 
    ipaddress: req.ip,
    language: req.acceptsLanguages(),
    software: req.headers['user-agent'],
  })
});

// Listen on port set in environment variable or default to 3000
var listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
