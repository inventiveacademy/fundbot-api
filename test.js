'use strict';

var restify = require('restify'),
  session = require('express-session'),
  cookieParser = require('cookie-parser'),
  mongoStore = require('connect-mongo')(session),
  mongoose = require('mongoose'),
  bcrypt = require('bcrypt')
  const saltRounds = 10
  var mypwd = 'cows'

var mongodbUri='mongodb://team2:inventive@ds161443.mlab.com:61443/fundbot'
mongoose.connect(mongodbUri, { useMongoClient: true })

// var app = express();
var app = restify.createServer()

var secret = 'shhh';

app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: secret,
  store: new mongoStore({
    mongooseConnection: mongoose.connection,
    collection: 'sessions' // default
  })
}));

// ROUTES, ETC.
var port = 3000;

app.listen(port, function() {
  console.log('listening on port ' + port + '.')
});

app.get('/', getApplications);

function getApplications(req, res, next) {
    console.log("get: all");
    req.session.user='ronr'  
    var hour = 3600000
    req.session.cookie.expires = new Date(Date.now() + hour) 
    var newhash = gethash(mypwd)
    console.log("newhash:"+newhash)
    res.send(newhash)
}


function gethash (pwd) {
  bcrypt.hash(pwd, saltRounds, function(err, hash) {
    console.log(hash)
    return hash
  });
}