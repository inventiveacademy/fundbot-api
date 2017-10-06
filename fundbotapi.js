// mongoose 4.3.x

var mongoose = require('mongoose')
var restify = require('restify')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var queryParser = require('query-parser')
var bcrypt = require('bcrypt')
const SALT_ROUNDS = 10
var server = restify.createServer()
// mailgun stuff
var api_key = 'key-6936814213c65cf51b76d57a39587665'
var domain = 'sandbox33b68518692b4762acf3495d8ced30ac.mailgun.org'
var mailgun = require('mailgun-js')({ apiKey: api_key, domain: domain })

// var paginate = require('restify-paginate')
// server.use(paginate(server))
var mongoosePaginate = require('mongoose-paginate');


server.name = 'FundBot API'

server.use(restify.plugins.bodyParser())
server.use(restify.plugins.queryParser())
const corsMiddleware = require('restify-cors-middleware')
const cors = corsMiddleware({
  preflightMaxAge: 5, //Optional
  origins: ['*'],
  allowHeaders: ['API-Token'],
  exposeHeaders: ['API-Token-Expiry']
})
server.pre(cors.preflight)
server.use(cors.actual)


var secret = "don't tell anyone"

var ObjectId = require('mongodb').ObjectID

var Schema = mongoose.Schema
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
    source: String,
    loanterms: String,
    isdeleted: Boolean
})
applicationSchema.plugin(mongoosePaginate)

var loginSchema = new Schema({
    user: String,
    pwd: String,
    lastlogin: Date,
    isloggedin: Boolean,
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
    },
    firstname: String,
    lastname: String,
    email: String,
    isdeleted: {
        type: Boolean,
        default: false
    },
})
loginSchema.plugin(mongoosePaginate)

var Application = mongoose.model('Application', applicationSchema)
var Login = mongoose.model('Login', loginSchema)


//mongodb connection
// var mongodbUri='mongodb://localhost:27017/fundbot'
var mongodbUri = 'mongodb://team2:inventive@ds161443.mlab.com:61443/fundbot'
mongoose.Promise = global.Promise
mongoose.connect(mongodbUri, { useMongoClient: true })
let db = mongoose.connection
//mongo error
db.on('error', console.error.bind(console, 'connection error:'))

// Wait for the database connection to establish, then start the app.
db.once('open', function() {
    var port = 3008
    server.listen(port, function() {
        console.log('%s listening at %s', server.name, `http://localhost:${port}
${exposedRoutes}`)
    })
})

function hashpassword(pwd) {
    return new Promise(function(resolve, reject) {
        bcrypt.hash(pwd, SALT_ROUNDS, function(err, hash) {
            if (err) reject(err)
            resolve(hash)
        })
    })
}

function comparepasswords(hash1, hash2) {
    return new Promise(function(resolve, reject) {
        bcrypt.compare(hash1, hash2, function(err, tf) {
            if (err) reject(err)
            resolve(tf)
        })
    })
}

function isJson(str) {
    try {
        JSON.parse(str)
    } catch (e) {
        return false
    }
    return true
}

function sendemail(data) {
    mailgun.messages().send(data).then(function(body) {
        console.log('success: ' + JSON.stringify(body))
        // res.send(200, 'mail sent')
        return (body)
    }).catch(function(err) {
        console.log('sendemail: ' + err)
        // res.send(500, err)
        return (err)
    })
}

async function sendEmailRoute(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin','*');
    var data = req.body
    mailgun.messages().send(data).then(function(body) {
        console.log('success: ' + JSON.stringify(body))
        res.send(200, 'mail sent')
    }).catch(function(err) {
        console.log('sendemail: ' + err)
        res.send(500, err)
    })
}

function formatNow() {
    var pad = function(n) { return n < 10 ? "0" + n : n }
    var date = new Date()
    var dateformatted = date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) +
        " " + pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds()) +
        " " + (date.getTimezoneOffset() > 0 ? "-" : "+") +
        pad(Math.floor(date.getTimezoneOffset() / 60)) +
        ":" + pad(date.getTimezoneOffset() % 60)
    return dateformatted
}

function getApplications(req, res, next) {
    console.log('page: '+req.query.page)
    let pagingoptions = { 
        sort: { modifydate: -1 },
        page : parseInt(req.query.page) || 1,
        limit : parseInt(req.query.limit) || 10
    }
    res.setHeader('Access-Control-Allow-Origin','*');
    console.log("get: all")
    Application.paginate({ "isdeleted": false }, pagingoptions,  function(err, applications) {
        if (err) {
            console.log(err)
            res.send(500, err)
        } else {
            //console.log(applications)
            res.send(200,applications);
        }
    })
}

function getApplicationById(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin','*');
    let id = req.params.id
    console.log("get: " + id)
    Application.findOne({ "isdeleted": false, "_id": id }, function(err, applications) {
        if (err) {
            console.log(err)
            res.send(500, err)
        } else res.send(applications)
    })
}

function getdeletedApplications(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin','*');
    console.log("get: deleted")
    Application.find({ "isdeleted": true }, function(err, applications) {
        if (err) {
            console.log(err)
            res.send(500, err)
        } else {
            //console.log(applications)
            res.send(applications)
        }
    })
}

function getApplicationsByQuery(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin','*');
    query = req.query
    query.isdeleted = false
    console.log("get: by query params " + JSON.stringify(query))
    Application.find(query, function(err, applications) {
        if (err) {
            console.log(err)
            res.send(500, err)
        } else {
            //console.log(applications)
            res.send(applications)
        }
    })
}

function updateApplicationById(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin','*');
    let id = req.params.id
    console.log("update: " + id)
    Application.findById(id, function(err, applications) {
        if (err) {
            console.log(err)
            res.send(500, err)
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
            if (req.body.loanterms) applications.loanterms = req.body.loanterms
            // applications.applicationstate = req.body.applicationstate // modified elsewere
            // applications.createdate = req.body.createdate
            if (applications.isdeleted) applications.isdeleted = false
            applications.modifydate = date

            applications.save(function(err, result) {
                if (err) {
                    console.log(err)
                    res.send(500, err)
                } else {
                    console.log(applications.id + ' updated')
                    res.send(result)
                }
            })
        }
    })
}

function deleteApplicationById(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin','*');
    let id = req.params.id
    console.log("delete: " + id)
    Application.findById(id, function(err, applications) {
        if (err) {
            console.log(err)
            res.send(500, err)
        } else {
            applications.isdeleted = true
            applications.save(function(err, result) {
                if (err) {
                    console.log(err)
                    res.send(500, err)
                } else {
                    console.log(applications.id + ' soft deleted')
                    res.send(result)
                }
            })
        }
    })
}

function undeleteApplicationById(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin','*');
    let id = req.params.id
    console.log("undelete: " + id)
    Application.findById(id, function(err, applications) {
        if (err) {
            console.log(err)
            res.send(500, err)
        } else {
            applications.isdeleted = false
            applications.save(function(err, result) {
                if (err) {
                    console.log(err)
                    res.send(500, err)
                } else {
                    console.log(applications.id + ' un-deleted')
                    res.send(result)
                }
            })
        }
    })
}

function postApplication(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin','*');
    console.log("post")
    var application = new Application()
    // var dateformatted = formatNow()
    var date = new Date()

    application.firstname = req.body.firstname
    application.middlename = req.body.middlename
    application.lastname = req.body.lastname
    application.email = req.body.email
    application.contactphone = req.body.contactphone
    application.address = req.body.address
    application.zip = req.body.zip
    application.city = req.body.city
    application.state = req.body.state
    application.source = req.body.source
    application.loanterms = req.body.loanterms
    application.applicationstate = 'application'
    application.createdate = date
    application.modifydate = date
    application.isdeleted = false

    application.save(function(err, result) {
        if (err) {
            console.log(err)
            res.send(500, err)
        } else {
            console.log(application.firstname + ' ' + application.lastname + ' saved to database')
            res.send(result)
        }
    })
}

function getLoginsByUser(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin','*');
    let user = req.params.user
    console.log("lookup user: " + user  )
    Login.findOne({ "user": user, "isdeleted": false },
        {   "user":1,
            "isuser":1,
            "isapplicant":1,
            "isadmin":1,
            "firstname":1,
            "lastname":1,
            "email":1,
            "isloggedin":1,
            "lastlogin":1,
            "_id": 0 }, function(err,login) {
        if (err) {
            console.log('ERR: '+ err)
            res.send(500, err)
        }
        if (login) {
            res.send(200,login)
        } else {
            console.log(user+' not Found')
            res.send(500, user+' not Found')
        }
        return next()
    })
}


function getLogins(req, res, next) {
    console.log('page: '+req.query.page)
    let pagingoptions = { 
        select:  'user isuser isapplicant isadmin firstname lastname email isloggedin lastlogin _id',
        sort: { user: 1 },
        page : parseInt(req.query.page) || 1,
        limit : parseInt(req.query.limit) || 10
    }
    res.setHeader('Access-Control-Allow-Origin','*');
    console.log("get: all")
    
    Login.paginate({ "isdeleted": false }, pagingoptions,  function(err, applications) {
        if (err) {
            console.log(err)
            res.send(500, err)
        } else {
            //console.log(applications)
            res.send(200,applications);
        }
    })
    return next()
}

// function xgetLogins(req, res, next) {
//     let pagingoptions = { 
//         page : parseInt(req.query.page) || 1,
//         limit : parseInt(req.query.limit) || 10
//     }
//     res.setHeader('Access-Control-Allow-Origin','*');
//     console.log("get all logins: ")
//     Login.paginate(
//         {"isdeleted": false },
//         {   "user":1,
//             "isuser":1,
//             "isapplicant":1,
//             "isadmin":1,
//             "firstname":1,
//             "lastname":1,
//             "email":1,
//             "isloggedin":1,
//             "lastlogin":1,
//             "_id": 0 },
//         pagingoptions, 
//         function(err,logins) {
//             if (err) {
//                 console.log('ERR: '+ err)
//                 res.send(500, err)
//             }
//             if (login) {
//                     res.send(200,logins)
//             } else {
//                 console.log('no logins')
//                 res.send(500, 'no Logins Found')
//             }
//             return next()
//         }
//     )
// }

function login(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin','*');
    var pwd = req.body.pwd
    console.log("trying user: " + req.body.user  )
    Login.findOne({ "user": req.body.user, "isdeleted": false }, async function(err,login) {
        if (login) {
            var tf = await comparepasswords(pwd, login.pwd)
            if (tf) {

                login.lastlogin = new Date()
                login.isloggedin = true
                login.save()

                console.log(login.user + ' logged in')
                res.send(200,login)
            } else {
                console.log('no login')
                res.send(500, 'login error')
            }
        } else {
            console.log('no login')
            res.send(500, 'login error')
        }
        return next()
    })
}

function createLogin(json) {
    return new Promise(function(resolve, reject) {
        bcrypt.hash(json.pwd, SALT_ROUNDS, function(err, hash) {
            try {
                console.log('hashed pwd: ' + hash)
                if (hash) {
                    var login = new Login()
                    login.user = json.user
                    login.pwd = hash
                    if (typeof json.isadmin != 'undefined') {
                        login.isadmin = json.isadmin
                    } else {
                        login.isadmin = false
                    }
                    if (typeof json.isapplicant != 'undefined') {
                        login.isapplicant = json.isapplicant
                    } else {
                        login.isapplicant = true
                    }
                    if (typeof json.isuser != 'undefined') {
                        login.isuser = json.isuser
                    } else {
                        login.isuser = false
                    }
                    login.save(function(err1, result) {
                        if (err) {
                            console.log(err1)
                            reject(err1)
                        } else {
                            console.log(login.user + ' ' + ' login saved to database')
                            var data = {
                                from: 'fundbot@inventive.io',
                                to: login.user,
                                subject: 'Your FUNDBOT new user info',
                                text: `login = your email, password = ${json.pwd}  Please change your password after you login the 1st time.  Thanks!`
                            }
                            sendemail(data)
                            resolve(result)
                        }
                    })
                } else {
                    console.log('no password hash')
                    reject('no password hash')
                }
            } catch (err2) {
                console.error(err2)
                reject(err2)
            }
        })
    })
}

async function callCreateLogin(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin','*');
    await createLogin(req.body).then(function(body) {
        console.log('success: ' + JSON.stringify(body))
        res.send(200, body)
    }).catch(function(err) {
        console.log('sendemail: ' + err)
        res.send(500, err)
    })
}

function logout(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin','*');
    let username = req.params.user
    Login.findOne({ "user": username }, function(err, user) {
        if (err) {
            console.log(err)
            res.send(500, err)
        } else {
            user.isloggedin = false
            user.save(function(err, result) {
                if (err) {
                    console.log(err)
                    res.send(500, err)
                } else {
                    console.log(username + ' logged out')
                    res.send(result)
                }
            })
        }
    })
}

function generateTempPassword() {
    var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = ""
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n))
    }
    return retVal
}

async function approveApplicationById(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin','*');
    let tempPWD = await generateTempPassword()
    let hash =  await hashpassword(tempPWD)
    let id = req.params.id
    console.log("approve: " + id)
    Application.findById(id, function(err, applications) {
        if (err) {
            console.log(err)
            res.send(500, err)
        } else {
            if ('application, validation'.indexOf(applications.applicationstate) >= 0) {
                applications.applicationstate = 'approved'
                applications.save(function(err, result) {
                    if (err) {
                        console.log(err)
                        res.send(500, err)
                    } else {
                        Login.findOne({ "user": applications.email }, async function(err,login) {
                            if (err) {
                                console.log(err)
                                res.send(500, err)
                            }
                            if (!login) {
                                bcrypt.hash(tempPWD, SALT_ROUNDS,
                                    function(err, hash) {
                                        var login = new Login()
                                        login.user = applications.email
                                        login.pwd = hash

                                        login.save(function(loginsaveerr, loginsaveresult) {
                                            if (loginsaveerr) {
                                                console.log(loginsaveerr)
                                                reject(loginsaveerr)
                                                res.send(500, loginsaveerr)
                                            } else {
                                                console.log(login.user + ' ' + ' login saved to database')
                                                var data = {
                                                    from: 'fundbot@inventive.io',
                                                    to: login.user,
                                                    subject: 'Your FUNDBOT new user info',
                                                    text: `login = your email, password = ${tempPWD}  Please change your password after you login the 1st time.  Thanks!`
                                                }
                                                resolve(data)
                                                sendemail(data)
                                            }
                                        })
                                    }
                                )
                            } else {
                                if (login.isdeleted) {
                                    res.send(500,'login is deleted')
                                }
                            }
                            res.send(200,'applicationstate = ' + applications.applicationstate)
                        })
                    }
                })
            } else {
                console.log('appliationstate not valid for approval: ' + applications.applicationstate)
                res.send(500, 'appliationstate not valid for approval: ' + applications.applicationstate)
            }
        }
    })
}

function deleteLogin(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin','*');
    let user = req.params.user
    console.log("delete: " + user)
    Login.findOne({ "user": user, "isdeleted": false }, function(err, login) {
        if (err) {
            console.log(err)
            res.send(500, err)
        } else {
            login.isdeleted = true
            login.save(function(err, result) {
                if (err) {
                    console.log(err)
                    res.send(500, err)
                } else {
                    console.log(login.user + ' soft deleted')
                    res.send(result.isdeleted)
                }
            })
        }
    })
}

async function updateLogin(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin','*');
    let user = req.params.user
    if (req.body.pwd) {
        var hashedpwd = await hashpassword (req.body.pwd)
    } 
    console.log("update: " + user)
    Login.findOne({ "user": user, "isdeleted": false }, function(err, logins) {
        if (err) {
            console.log(err)
            res.send(500, err)
        } else {
            if (req.body.firstname) logins.firstname = req.body.firstname
            if (req.body.lastname) logins.lastname = req.body.lastname
            if (req.body.pwd) logins.pwd = hashedpwd
            if (req.body.isuser) logins.isuser = req.body.isuser
            if (req.body.isadmin) logins.isadmin = req.body.isadmin
            if (req.body.isapplicant) logins.isapplicant = req.body.isapplicant
            if (req.body.email) logins.email = req.body.email
            if (req.body.isloggedin) logins.isloggedin = req.body.isloggedin
            if (req.body.lastlogin) logins.lastlogin = req.body.lastlogin

            logins.save(function(err, result) {
                if (err) {
                    console.log(err)
                    res.send(500, err)
                } else {
                    console.log(logins.user + ' updated')
                    res.send(result)
                }
            })
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


server.get('/logins', getLogins)
server.get('/logins/:user', getLoginsByUser)
server.post('/logins', callCreateLogin)
server.del('/logins/:user', deleteLogin)
server.put('/logins/:user', updateLogin)

server.post('/applications', postApplication)
server.post('/login', login)
server.post('/sendemail', sendEmailRoute)

server.del('/applications/:id', deleteApplicationById)

server.put('/applications/:id', updateApplicationById)
server.put('/undeleteapplication/:id', undeleteApplicationById)
server.put('/approveapplication/:id', approveApplicationById)

var exposedRoutes = `
get '/'                                  = get all

get '/logout/:user'                      = logout user  

get  '/logins'                           = get all logins
get  '/logins/:user'                     = get one login                                          
put  '/logins/:user'                     = update login/user info send JSON of user
del  '/logins/:user'                     = soft delete a user/login
post '/logins                            = create new login send JSON 
                                           {"user": "xxx@xxx.xxx", "pwd":"mypassword"}

post '/login'                            = login and set lastlogindate send JSON:
                                           {"user": "xxx@xxx.xxx", "pwd":"mypassword"}
post '/sendemail'                        = send email use JSONobject
                                            {   from: 'fundbot@inventive.io',
                                                to: 'recipient@domain.com',
                                                subject: 'this is the subject',
                                                text: 'this is the body of the email' 
                                            }

get  '/applications'                     = get all
get  '/applications/:id'                 = get by id
post '/applications'                     = create a new application
del  '/applications/:id'                 = soft delete an application
put  '/applications/:id'                 = update by id

get '/applications-search?field=fvalue'  = get by search params
get '/getdeletedapplications'            = get all deleted applications
put '/undeleteapplication/:id'           = undelete by id
put '/approveapplication/:id'            = approve application

======================================================================`


//include routes
// let routes = require('./routes/index')
// server.use('/', routes)

// catch 404 and forward to error handler
server.use(function(req, res, next) {
    let err = new Error('File Not Found')
    err.status = 404
    next(err)
})

// error handler
// define as the last app.use callback
server.use(function(err, req, res, next) {
    res.status(err.status || 500)
    res.render('error', {
        message: err.message,
        error: {}
    })
})

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
  // application specific logging, throwing an error, or other logic here
})
