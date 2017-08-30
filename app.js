var restify = require('restify');
var server = restify.createServer();
server.name = "RESTify Services Server"


const corsMiddleware = require('restify-cors-middleware')
const MongoClient = require('mongodb').MongoClient
MongoClient.connect('mongodb://ronr:ronrdb@ds027618.mlab.com:27618/classdb', (err, database) => {
    if (err) return console.log(err)
        db = database
        server.listen(8080, function() {
            console.log('%s listening at %s', server.name, "http://localhost:8080");
        })
})
var ObjectId = require('mongodb').ObjectID;

const cors = corsMiddleware({
  preflightMaxAge: 5, //Optional
  origins: ['*'],
  allowHeaders: ['API-Token'],
  exposeHeaders: ['API-Token-Expiry']
})

server.pre(cors.preflight)
server.use(cors.actual)

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

function Employee() {
    
    this.firstname = '';
    this.lastname = '';;
    this.createdate = '';
    this.modifydate = '';
}

function getEmployees(req, res, next) {
    // Resitify currently has a bug which doesn't allow you to set default headers
    // These headers comply with CORS and allow us to serve our response to any origin
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    db.collection('employees').find().toArray(function(err, results) {
        res.send(results);
    })
    
    console.log('get: all')
}

function getEmployee(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var dbid =req.params.id;
    db.collection('employees').find({ "_id": ObjectId(dbid) }).toArray(function(err, results) {
        if (err) return console.log(err)
            console.log('get: '+dbid)
            res.send(results);
    })
    
}

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

function postEmployee(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var employee = new Employee();
    var dateformatted = formatNow(); 
    
    employee.firstname = req.body.firstname;
    employee.lastname = req.body.lastname;
    employee.createdate = dateformatted; 
    employee.modifydate = dateformatted;

    db.collection('employees').save(employee, (err, result) => {
    if (err) return console.log(err)
        console.log(employee.firstname+' '+employee.lastname+' saved to database')
        res.send(result);
    })
    //save the new Employees to the arrdata collection
   
}

function updateEmployee(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    var dbid = req.params.id;
    var dateformatted = formatNow();
    console.log(req.body)
    //db.foo.updateMany({}, {$set: {lastLookedAt: Date.now() / 1000}})
    db.collection('employees').updateOne(
        {"_id": ObjectId(dbid)}, 
        {$set:
            {
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                modifydate: dateformatted
            }
        },
        (err, result) => 
    {
        if (err) return console.log(err)
        console.log(dbid+' updated in database')
        
    })
    res.send("done");
}

function deleteEmployee(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");

    var dbid = req.params.id;
    db.collection('employees').deleteOne( {"_id": ObjectId(dbid)} ,
    (err, result) => 
    {
        if (err) return console.log(err)
        console.log(dbid+' deleted from employees')
        res.send(result);
    })
}

// Set up our routes and start the server
server.get('/employees', getEmployees);
server.get('/employees/:id', getEmployee);
server.post('/employees', postEmployee);
server.del('/employees/:id', deleteEmployee);
server.put('/employees/:id', updateEmployee);


