require('dotenv').config();
var express = require('express');
var app = express();

var cors = require('cors');
const dns = require('dns');
// const bodyParser = require('body-parser');

 // some legacy browsers choke on 204
app.use(cors({optionsSuccessStatus: 200})); 

app.use(express.static('public'));

//BodyParser is depreciateded
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

//this is the correct way now
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

//Aux methods
const generateRamdomId = () => {
  return Math.random().toString(36).substring(7); 
}

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

app.post('/api/shorturl', async (req, res) => {
  const { url } = req.body;
  const isValid = await checkUrlExists(url);

  if(isValid) {
    const shortUrl = generateRamdomId();
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

//Exercise Tracker
const fakeDBUsers = [];
const fakeDBExercises = [];
const fakeDBLogs = [];

app.post('/api/users', (req, res) => {
  const { username } = req.body;
  const genId = generateRamdomId();
  
  var userJson = {
    username: username,
    _id: genId
  }
  
  fakeDBUsers.push(userJson);
  return res.json(userJson);
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const exercisesId = req.params._id;
  const { username, description, duration, date } = req.body;

  console.log(username, exercisesId, description, duration, date)

  var exercise = {
    _id: exercisesId,
    description: description,
    duration: duration,
    date: date === undefined ? new Date() : new Date(date)
  }

  fakeDBExercises.push(exercise);
  return res.json(exercise);
});

app.get('/api/users/:_id/logs', (req, res) => {
  return res.json({ })
});

// Listen on port set in environment variable or default to 3000
var listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
