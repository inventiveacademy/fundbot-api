// mongoose 4.3.x
var mongoose = require('mongoose')
var restify = require('restify')
var bodyParser = require('body-parser')
var server = restify.createServer()
server.name = 'FundBot API'
 
server.use(restify.plugins.bodyParser());

var ObjectId = require('mongodb').ObjectID;

var Schema = mongoose.Schema;
var applicationSchema = new Schema({
	firstname : String
	,middlename : String
	,lastname : String
	,email : String
	,contactphone : String
	,address : String
	,zip : String
	,city : String
	,state : String
	,applicationstate : String
	,createdate : Date
	,modifydate : Date
	,isdeleted : Boolean

});
var Application = mongoose.model('Application',applicationSchema)

//mongodb connection
var mongodbUri = 'mongodb://team2:inventive@ds161443.mlab.com:61443/fundbot';
mongoose.connect(mongodbUri,{useMongoClient: true} );
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

function formatNow () {
    var pad = function(n) {return n < 10 ? "0"+n : n;};
    var date = new Date();
    var dateformatted = date.getFullYear()+"-"+pad(date.getMonth()+1)+"-"+pad(date.getDate())
        +" "+pad(date.getHours())+":"+pad(date.getMinutes())+":"+pad(date.getSeconds())
        +" "+(date.getTimezoneOffset() > 0 ? "-" : "+")
            +pad(Math.floor(date.getTimezoneOffset()/60))
            +":"+pad(date.getTimezoneOffset()%60);
    return dateformatted;
}

function getApplications(req, res, next) {
	console.log("get: all");
    Application.find({"isdeleted":false},function (err, applications) {
	  if (err) return console.error(err);
	  console.log(applications)
	  res.send(applications)
	})
}

function getApplicationsById(req, res, next) {
	let id = req.body._id
	console.log("get: "+id)    
	Application.find({"isdeleted":false, "_id":id}, function (err, applications) {
	  if (err) return console.error(err);
	  console.log(applications)
	  res.send(applications)
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
  
    application.save(function (err, result) {
    	if (err) return console.log(err)
        else console.log(application.firstname+' '+application.lastname+' saved to database')
        	res.send(result)
    })
}



//routes
server.get('/', getApplications);
server.get('/applications', getApplications);
server.get('/applications/:id', getApplicationsById);
server.post('/applications', postApplication);


//include routes 
// let routes = require('./routes/index');
// server.use('/', routes);

// catch 404 and forward to error handler
server.use(function(req, res, next){
	let err = new Error('File Not Found');
	err.status = 404;
	next(err);
});

// error handler
// define as the last app.use callback
server.use(function(err, req, res, next){
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});