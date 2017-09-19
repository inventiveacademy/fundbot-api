// mongoose 4.3.x

var mongoose = require('mongoose')
var restify = require('restify')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var queryParser = require('query-parser')
var bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
var server = restify.createServer()

// mailgun stuff
var api_key= 'key-6936814213c65cf51b76d57a39587665';
var domain ='sandbox33b68518692b4762acf3495d8ced30ac.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

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
    nationality: String,
    ssn: String,
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
    isstudent: Boolean,
    isadmin: {
        type: Boolean,
        default: false
    },
    isapplicant: {
        type: Boolean,
        default: true
    },
    isuser: {
        type: Boolean,
        default: false
    }
});


var Application = mongoose.model('Application', applicationSchema)
var Login = mongoose.model('Login', loginSchema)


var exposedRoutes = `
get '/'                                  = get all
get '/applications'                      = get all
get '/applications/:id'                  = get by id
get '/applications-search?field=fvalue'  = get by search params
get '/getdeletedapplications'            = get all deleted applications
get '/logout/:user"                      = logout user                                            


post '/applications'                     = create a new application
post '/login'                            = login and set lastlogindate send JSON 
                                           {"user": "xxx@xxx.xxx", "pwd":"mypassword"}
post '/createlogin                       = create login send JSON 
                                           {"user": "xxx@xxx.xxx", "pwd":"mypassword"}
post '/sendemail'                        = send email use JSONobject
                                            {
                                                from: 'Shalay<smashford12@gmail.com>',
                                                to: 'rcrutherford@gmail.com',
                                                subject: 'Hello! Is this working?',
                                                text: 'You is Beautiful, You is Smart, You is Important'
                                            }


del '/applications/:id'                  = soft delete an application

put '/applications/:id'                  = update by id
put '/undeleteapplication/:id'           = undelete by id
put '/approveapplication/:id'            = approve application
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

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function sendemail (req, res, next) {
//Password email reset- Testing
    
    // var data = {
    //     from: 'Shalay<smashford12@gmail.com>',
    //     to: 'rcrutherford@gmail.com',
    //     subject: 'Hello! Is this working?',
    //     text: 'You is Beautiful, You is Smart, You is Important'
    // };
    var data = req.body

    mailgun.messages().send(data, function (error, body) {
        if (error) {
            console.log(error)
            res.send(500,error)
        } else {
            console.log(data)
            res.send(200)
        }
    })
}

function generatePassword() {
    var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

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
    Application.findOne({ "isdeleted": false, "_id": id }, function(err, applications) {
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

            if (req.body.firstname) applications.firstname = req.body.firstname
            if (req.body.middlename) applications.middlename = req.body.middlename
            if (req.body.lastname) applications.lastname = req.body.lastname
            if (req.body.email) applications.email = req.body.email
            if (req.body.contactphone) applications.contactphone = req.body.contactphone
            if (req.body.address) applications.address = req.body.address
            if (req.body.zip) applications.zip = req.body.zip
            if (req.body.city) applications.city = req.body.city
            if (req.body.state) applications.state = req.body.state
            if (req.body.nationality) applications.nationality = req.body.nationality
            if (req.body.ssn) applications.ssn = req.body.ssn
            // applications.applicationstate = req.body.applicationstate // modified elsewere
            // applications.createdate = req.body.createdate
            if (applications.isdeleted) applications.isdeleted = false
            applications.modifydate = date

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
	bcrypt.hash(req.body.pwd,SALT_ROUNDS,function(err, hash){
		console.log("user: " + req.body.user + " pwd: " + req.body.pwd + " hash: "+hash)

	    Login.findOne({ "user": req.body.user}, function(err, user) {
	        if (err) {
	            console.log(err)
	            res.send(500,err)
	        } else {
	            if (!user) {
	                res.send(401,"User Not Found")
	            } else {
	            	bcrypt.compare(req.body.pwd, hash, function(err, tf) {
					    if (tf) {

			                user.lastlogin = new Date()
			                user.isloggedin = true
				            user.save()

			                console.log(user.user + ' logged in')
			                res.send(user)
			            }
		        	})
	            }
	        }
	        return next();
	    })
	})
}

function createLogin (req, res, next) {
	bcrypt.hash(req.body.pwd,SALT_ROUNDS,function(err, hash){
		try {
			console.log('hashed pwd: ' + hash)
			if (hash) {
				var login = new Login()
				login.user = req.body.user
				login.pwd = hash
                 if (typeof req.body.isadmin != 'undefined') {
                    login.isadmin = req.body.isadmin
                 } else {
                    login.isadmin = false
                 }
				if (typeof req.body.isapplicant != 'undefined') {
                    login.isapplicant = req.body.isapplicant
                 } else {
                    login.isapplicant = true
                 }
				if (typeof req.body.isstudent != 'undefined') {
                    login.isstudent = req.body.isstudent
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

// function updateUser(req, res, next) {
//     let user = req.params.user
//     console.log("update: " + user)
//     Login.findOne({ "user": user}, function(err, login) {
//         if (err) {
//             console.log(err)
//             res.send(500,err)
//         } else {
//             //console.log(applications)
//             var date = new Date()


//             pwd: String,
//             lastlogin: Date,
//             isloggedin: Boolean,
//             isstudent: Boolean,
//             isadmin: {
//                 type: Boolean,
//                 default: false
//             },
//             isapplicant: {
//                 type: Boolean,
//                 default: true
//             },
//             isuser: {
//                 type: Boolean,
//                 default: false
//             }

//             applications.firstname = req.body.firstname
//             applications.middlename = req.body.middlename
//             applications.lastname = req.body.lastname
//             applications.email = req.body.email
//             applications.contactphone = req.body.contactphone
//             applications.address = req.body.address
//             applications.zip = req.body.zip
//             applications.city = req.body.city
//             applications.state = req.body.state
//             // applications.applicationstate = req.body.applicationstate
//             // applications.createdate = req.body.createdate
//             applications.modifydate = date
//             applications.isdeleted = false

//             applications.save(function(err, result) {
//                 if (err) {
//                     console.log(err)
//                     res.send(500,err)
//                 } else {
//                     console.log(applications.id + ' updated')
//                     res.send(result)
//                 }
//             })
//         }
//     })
// }


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

function approveApplicationById(req, res, next) {
    let id = req.params.id
    console.log("approve: " + id)
    Application.findById(id, function(err, applications) {
        if (err) {
            console.log(err)
            res.send(500,err)
        } else {
            if ('application, validation'.indexOf(applications.applicationstate)>=0) {
                applications.applicationstate = 'approved'
                applications.save(function(err, result) {
                    if (err) {
                        console.log(err)
                        res.send(500,err)
                    } else {
                        console.log('applicationstate =' + ' approved')
                        var pwd = generatePassword()
                        // var userreq = {"user":applications.email, "pwd":pwd}
                        // createLogin(userreq,{})
                        
                    }
                })
            } else {
                console.log('appliationstate not valid for approval: '+applications.applicationstate)
                res.send(500,'appliationstate not valid for approval: '+applications.applicationstate)
            }
        }
    })
}

// application states
// application
// validation
// approved
// funding
// closing
// dispersal
// grace_period
// payment
// collections
// sold
// closed

//routes
server.get('/', getApplications)
server.get('/applications', getApplications)
server.get('/applications/:id', getApplicationById)
server.get('/applications-search', getApplicationsByQuery)
server.get('/getdeletedapplications', getdeletedApplications)
server.get('/logout/:user', logout)

server.post('/applications', postApplication);
server.post('/createlogin', createLogin)
server.post('/login', login)
server.post('/sendemail',sendemail)

server.del('/applications/:id', deleteApplicationById)

server.put('/applications/:id', updateApplicationById)
server.put('/undeleteapplication/:id', undeleteApplicationById)
server.put('/approveapplication/:id',approveApplicationById)


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
