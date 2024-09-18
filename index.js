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
  const randomBytes = new Uint8Array(24);
  crypto.getRandomValues(randomBytes);

  const hexId = Array.from(randomBytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

  return hexId;
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

/* NOTES */
/* I will add the MongoDB Atlas to this */
const fakeDBUsers = [];
const fakeDBExercises = [];
const fakeDBLogs = [];

const filterToDate = (logs, endDate) => {
  return logs.filter(log => new Date(log.date) <= new Date(endDate));
}

const filterFromDate = (logs, startDate) => {
  return logs.filter(log => new Date(log.date) >= new Date(startDate));
}

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
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  const user = fakeDBUsers.find(user => user._id === userId);

  var userExerciseObj = {
    username: user.username,
    description: description.toString(),
    duration: Number(duration),
    date: date === undefined ? new Date().toDateString() : new Date(date).toDateString(),
    _id: user._id
  }
  
  fakeDBExercises.push(userExerciseObj);

  //Add to loggers
  const userLogs = fakeDBLogs.find(user => user._id === userId);
  
  var logExerciseObj = { 
    description: userExerciseObj.description, 
    duration: userExerciseObj.duration, 
    date: userExerciseObj.date 
  }

  if(userLogs) {
    userLogs.log.push(logExerciseObj);
    userLogs.count + 1;
  } else {
    var userLogObj = { 
      username: userExerciseObj.username, 
      count: 1,
      _id: userExerciseObj._id ,
      log: [logExerciseObj] 
    }

    fakeDBLogs.push(userLogObj)
  }

  return res.json(userExerciseObj);
});

app.get('/api/users', (req, res) => {
  return res.json(fakeDBUsers);
});

app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;  
  const limit = Number(req.query.limit) || 0;
  const from = req.query.from || new Date(0);
  const to = req.query.to || new Date(Date.now())

  console.log(limit, from, to)

  const userLogs = fakeDBLogs.find(user => user._id === userId);

  if(limit > userLogs.length) {
    limit = userLogs.length;
  }

  if(limit !== 0) {
    userLogs.log = userLogs.log.slice(0, limit);
  }

  /* 
    if(from !== new Date(0)) {
     userLogs.log = filterToDate(userLogs.log, from);
    }

    if(to !== new Date(Date.now)) {
      userLogs.log = filterFromDate(userLogs.log, from);
    }
  
  */
  return res.json(userLogs)
});
// Listen on port set in environment variable or default to 3000
var listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
