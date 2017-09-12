//Scott tesing features branch
// mongoose 4.3.x
var mongoose = require('mongoose')
var restify = require('restify')
var session = require('express-session')
var cookieParser = require('cookie-parser')
var mongoStore = require('connect-mongo')(session)
var bodyParser = require('body-parser')
var queryParser = require('query-parser')
var bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
var server = restify.createServer()

server.name = 'FundBot API'

server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());

// attach the session manager

var secret = "don't tell anyone"

var ObjectId = require('mongodb').ObjectID;

var Schema = mongoose.Schema;
var applicationSchema = new Schema({
    firstname: String,
    middlename: String,
    lastname: String,
    email: String,
    contactphone: String,
    address: String,
    zip: String,
    city: String,
    state: String,
    applicationstate: String,
    createdate: Date,
    modifydate: Date,
    isdeleted: Boolean
});

var loginSchema = new Schema({
    user: String,
    pwd: String,
    lastlogin: Date,
    isloggedin: Boolean,
    isadmin: Boolean,
    isapplicant: Boolean,
    isstudent: Boolean
});


var Application = mongoose.model('Application', applicationSchema)
var Login = mongoose.model('Login', loginSchema)


var exposedRoutes = `
get '/'                                  = get all
get '/applications'                      = get all
get '/applications/:id'                  = get by id
get '/applications-search?field=fvalue'  = get by search params
get '/getdeletedapplications'            = get all deleted applications


post '/applications'                     = create a new application
post '/login?user=xxx&pwd=yyy'           = login and set lastlogindate
post '/createlogin?user=xxx&pwd=yyy'     = create login
    note: you can also add isstudent, isadmin, and isapplicant as parameters
    defaults are isapplicant=true, isadmin=false, isstudent=false

del '/applications/:id'                  = soft delete an application

put '/applications/:id'                  = update by id
put '/undeleteapplication/:id'           = undelete by id
======================================================================`


//mongodb connection
// var mongodbUri='mongodb://localhost:27017/fundbot'
var mongodbUri = 'mongodb://team2:inventive@ds161443.mlab.com:61443/fundbot';
mongoose.Promise = global.Promise;
mongoose.connect(mongodbUri, { useMongoClient: true });
let db = mongoose.connection;
//mongo error
db.on('error', console.error.bind(console, 'connection error:'));

// Wait for the database connection to establish, then start the app.
db.once('open', function() {
    var port = 3008
    server.listen(port, function() {
        console.log('%s listening at %s', server.name, `http://localhost:${port}
${exposedRoutes}`);
    })
});

server.use(session({
    resave: true,
    saveUninitialized: true,
    secret: secret,
    store: new mongoStore({
        mongooseConnection: db,
        collection: 'sessions' // default
    })
}));

function formatNow() {
    var pad = function(n) { return n < 10 ? "0" + n : n; };
    var date = new Date();
    var dateformatted = date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) +
        " " + pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds()) +
        " " + (date.getTimezoneOffset() > 0 ? "-" : "+") +
        pad(Math.floor(date.getTimezoneOffset() / 60)) +
        ":" + pad(date.getTimezoneOffset() % 60);
    return dateformatted;
}

function getApplications(req, res, next) {
    console.log("get: all");
    Application.find({ "isdeleted": false }, function(err, applications) {
        if (err) {
            console.log(err)
            res.send(500,err)
        } else {
            //console.log(applications)
            res.send(applications)
        }
    })
}

function getApplicationById(req, res, next) {
    let id = req.params.id
    console.log("get: " + id)
    Application.find({ "isdeleted": false, "_id": id }, function(err, applications) {
        if (err) {
            console.log(err)
            res.send(500,err)
        } else res.send(applications)
    })
}

function getdeletedApplications(req, res, next) {
    console.log("get: deleted");
    Application.find({ "isdeleted": true }, function(err, applications) {
        if (err) {
            console.log(err)
            res.send(500,err)
        } else {
            //console.log(applications)
            res.send(applications)
        }
    })
}

function getApplicationsByQuery(req, res, next) {
    query = req.query
    query.isdeleted = false
    console.log("get: by query params " + JSON.stringify(query));
    Application.find(query, function(err, applications) {
        if (err) {
            console.log(err)
            res.send(500,err)
        } else {
            //console.log(applications)
            res.send(applications)
        }
    })
}

function updateApplicationById(req, res, next) {
    let id = req.params.id
    console.log("update: " + id)
    Application.findById(id, function(err, applications) {
        if (err) {
            console.log(err)
            res.send(500,err)
        } else {
            //console.log(applications)
            var date = new Date()

            applications.firstname = req.body.firstname
            applications.middlename = req.body.middlename
            applications.lastname = req.body.lastname
            applications.email = req.body.email
            applications.contactphone = req.body.contactphone
            applications.address = req.body.address
            applications.zip = req.body.zip
            applications.city = req.body.city
            applications.state = req.body.state
            // applications.applicationstate = req.body.applicationstate
            // applications.createdate = req.body.createdate
            applications.modifydate = date
            applications.isdeleted = false

            applications.save(function(err, result) {
                if (err) {
                    console.log(err)
                    res.send(500,err)
                } else {
                    console.log(applications.id + ' updated')
                    res.send(result)
                }
            })
        }
    })
}

function deleteApplicationById(req, res, next) {
    let id = req.params.id
    console.log("delete: " + id)
    Application.findById(id, function(err, applications) {
        if (err) {
            console.log(err)
            res.send(500,err)
        } else {
            applications.isdeleted = true
            applications.save(function(err, result) {
                if (err) {
                    console.log(err)
                    res.send(500,err)
                } else {
                    console.log(applications.id + ' soft deleted')
                    res.send(result)
                }
            })
        }
    })
}

function undeleteApplicationById(req, res, next) {
    let id = req.params.id
    console.log("undelete: " + id)
    Application.findById(id, function(err, applications) {
        if (err) {
            console.log(err)
            res.send(500,err)
        } else {
            applications.isdeleted = false
            applications.save(function(err, result) {
                if (err) {
                    console.log(err)
                    res.send(500,err)
                } else {
                    console.log(applications.id + ' un-deleted')
                    res.send(result)
                }
            })
        }
    })
}

function postApplication(req, res, next) {
    console.log("post")
    var application = new Application()
    // var dateformatted = formatNow()
    var date = new Date();

    application.firstname = req.body.firstname
    application.middlename = req.body.middlename
    application.lastname = req.body.lastname
    application.email = req.body.email
    application.contactphone = req.body.contactphone
    application.address = req.body.address
    application.zip = req.body.zip
    application.city = req.body.city
    application.state = req.body.state
    application.applicationstate = 'application'
    application.createdate = date
    application.modifydate = date
    application.isdeleted = false

    application.save(function(err, result) {
        if (err) {
            console.log(err)
            res.send(500,err)
        } else {
            console.log(application.firstname + ' ' + application.lastname + ' saved to database')
            res.send(result)
        }
    })
}

function login(req, res, next) {
	bcrypt.hash(req.query.pwd,SALT_ROUNDS,function(err, hash){
		console.log("user: " + req.query.user + " pwd: " + req.query.pwd + " hash: "+hash)

	    Login.findOne({ "user": req.query.user}, function(err, user) {
	        if (err) {
	            console.log(err)
	            res.send(500,err)
	        } else {
	            if (!user) {
	                res.send(401,"User Not Found")
	            } else {
	            	bcrypt.compare(req.query.pwd, hash, function(err, tf) {
					    if (tf) {

			                var hour = 3600000
			                req.session.cookie.expires = new Date(Date.now() + hour)
			                req.session.user = user.user
			                req.session.loggedin = true
			                user.lastlogin = new Date()
			                user.isloggedin = true
				            user.save()

			                console.log(user.user + ' logged in')
			                res.send(user.user+" login success")
			            }
		        	})
	            }
	        }
	        return next();
	    })
	})
}


function createLogin (req, res, next) {
	bcrypt.hash(req.query.pwd,SALT_ROUNDS,function(err, hash){
		try {
			console.log('hashed pwd: ' + hash)
			if (hash) {
				var login = new Login()
				login.user = req.query.user
				login.pwd = hash
                 if (typeof req.query.isadmin != 'undefined') {
                    login.isadmin = req.query.isadmin
                 } else {
                    login.isadmin = false
                 }
				if (typeof req.query.isapplicant != 'undefined') {
                    login.isapplicant = req.query.isapplicant
                 } else {
                    login.isapplicant = true
                 }
				if (typeof req.query.isstudent != 'undefined') {
                    login.isstudent = req.query.isstudent
                 } else {
                    login.isstudent = false
                 }
				login.save(function(err, result) {
				    if (err) {
				        console.log(err)
				        res.send(500,err)
				    } else {
				        console.log(login.user + ' ' + ' login saved to database')
				        res.send(result)
				    }
				})
			} else {
				console.log('no hash')
				res.send(500,'no hash')
			}
		} catch (err) {
			console.error(err)
		}
	})
}

function logout(req, res, next) {
    let username = req.params.user
    Login.findOne({ "user": username}, function(err, user) {
        if (err) {
            console.log(err)
            res.send(500,err)
        } else {
            user.isloggedin = false
            user.save(function(err, result) {
                if (err) {
                    console.log(err)
                    res.send(500,err)
                } else {
                    console.log(username+ ' logged out')
                    res.send(result)
                }
            })
        }
    })
}

//routes
server.get('/', getApplications)
server.get('/applications', getApplications)
server.get('/applications/:id', getApplicationById)
server.get('/applications-search', getApplicationsByQuery)
server.get('/getdeletedapplications', getdeletedApplications)

server.post('/applications', postApplication);
server.post('/createlogin', createLogin)
server.post('/login', login)
server.post('/logout/:user', logout)

server.del('/applications/:id', deleteApplicationById)

server.put('/applications/:id', updateApplicationById)
server.put('/undeleteapplication/:id', undeleteApplicationById)


//include routes
// let routes = require('./routes/index');
// server.use('/', routes);

// catch 404 and forward to error handler
server.use(function(req, res, next) {
    let err = new Error('File Not Found')
    err.status = 404
    next(err)
});

// error handler
// define as the last app.use callback
server.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
