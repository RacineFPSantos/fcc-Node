// init project - This Boilerplate code maybe needs updates
require('dotenv').config();
var express = require('express');
var app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');

const dns = require('dns');
const bodyParser = require('body-parser');
const urlParser = require('url');

app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

//URL Shortener Microservice
const urlDatabase = []; //Fake Database

const checkUrlExists = async (url) => {
  return new Promise((resolve, rejects) => {
    try {
      const hostname = new URL(url).hostname;

      if(!hostname) {
        return resolve(false);
      }
  
      dns.lookup(hostname, (err) => {
        return err ? resolve(false) : resolve(true);
      });
    } catch (error) {
      console.log("checkUrlExists::ERROR: ", error);
      resolve(false);
    }
  });
}

const generateShortUrl = () => {
  return Math.random().toString(36).substring(7); 
}

app.post('/api/shorturl', async (req, res) => {
  const { url } = req.body;
  const isValid = await checkUrlExists(url);

  if(isValid) {
    const shortUrl = generateShortUrl();
    const shortJson = { 
      original_url : url, 
      short_url : shortUrl
    }

    urlDatabase.push(shortJson);
    return res.json(shortJson);
  } else {
    return res.json({ error: 'invalid url' })
  }
});

app.get('/api/shorturl/:shortUrl', async (req, res) => {
  const shortUrl = req.params.shortUrl;
  const urlEntry = urlDatabase.find(entry => entry.short_url === shortUrl);
  if (urlEntry) {
    res.redirect(urlEntry.original_url);
  } else {
    res.status(404).json({ message: 'Short URL not found' });
  }
});

// Listen on port set in environment variable or default to 3000
var listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
