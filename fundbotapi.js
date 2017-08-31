// mongoose 4.3.x
var mongoose = require('mongoose')
var restify = require('restify')
var bodyParser = require('body-parser')
var queryParser = require('query-parser')
var server = restify.createServer()
server.name = 'FundBot API'

server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());

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
var Application = mongoose.model('Application', applicationSchema)

//mongodb connection
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
        console.log('%s listening at %s', server.name, `http://localhost:${port}`);
    })
});

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
            res.status(500).send(err)
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
            res.status(500).send(err)
        } 
        else res.send(applications)
    })
}

function getdeletedApplications(req, res, next) {
    console.log("get: deleted");
    Application.find({ "isdeleted": true }, function(err, applications) {
        if (err) {
            console.log(err)
            res.status(500).send(err)
        } else {
            //console.log(applications)
            res.send(applications)
        }
    })
}

function getApplicationsByQuery(req, res, next) {
	query =req.query
	query.isdeleted=false
    console.log("get: by query params "+JSON.stringify(query));
    Application.find(query, function(err, applications) {
        if (err) {
            console.log(err)
            res.status(500).send(err)
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
        	res.status(500).send(err)
        }
        else {
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
	        		res.status(500).send(err)
	        	}
	            else {
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
            res.status(500).send(err)
        } 
        else {
        	applications.isdeleted = true
        	applications.save(function(err, result) {
		        if (err) {
		            console.log(err)
		            res.status(500).send(err)
		        }
		        else {
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
            res.status(500).send(err)
        } 
        else {
        	applications.isdeleted = false
        	applications.save(function(err, result) {
		        if (err) {
		            console.log(err)
		            res.status(500).send(err)
		        }
		        else {
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
            res.status(500).send(err)
        }
        else {
        	console.log(application.firstname + ' ' + application.lastname + ' saved to database')
        	res.send(result)
        }
    })
}

//routes
server.get('/', getApplications);
server.get('/applications', getApplications);
server.get('/applications/:id', getApplicationById);
server.get('/applications-search', getApplicationsByQuery);
server.get('/getdeletedapplications', getdeletedApplications);

server.post('/applications', postApplication);

server.del('/applications/:id', deleteApplicationById);

server.put('/applications/:id', updateApplicationById);
server.put('/undeleteapplication/:id', undeleteApplicationById)




//include routes 
// let routes = require('./routes/index');
// server.use('/', routes);

// catch 404 and forward to error handler
server.use(function(req, res, next) {
    let err = new Error('File Not Found');
    err.status = 404;
    next(err);
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

