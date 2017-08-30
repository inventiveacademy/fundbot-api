var restify = require('restify')
var restserver = restify.createServer()
restserver.name = 'REST server'

restserver.use(restify.plugins.queryParser());
restserver.use(restify.plugins.bodyParser());

restserver.listen(3001, function() {
            console.log('%s listening at %s', restserver.name, "http://localhost:3001");
        })

var arrEmployees = [
	{id: 0, fname: "Ron", lname: "Rutherford"},
	{id: 1, fname: "Bill", lname: "Jones"}
]

function Employees () {
	this.id = 0
	this.fname = ''
	this.lname = ''
}

function postEmployees (req, res, next) {
	//body = JSON.parse(req.body)
	body = req.body
	console.log('rest: post:'+JSON.stringify(body))
	var newid = Math.max.apply(Math, arrEmployees.map(function(o) { return o.id; })) + 1;
	var employee = new Employees();
	employee.id = newid
	employee.fname = body.fname
	employee.lname = body.lname
	arrEmployees.push(employee)
	res.send(arrEmployees)
} 

function getEmployees (req, res, next) {
	console.log('rest: get: all')
	res.send(arrEmployees)
}

function getEmployee (req, res, next) {
	var thisid = parseInt(req.params.id)
	console.log('rest: get: '+thisid)
	for (var i=0;i<=arrEmployees.length-1;i++) {
		if (arrEmployees[i].id == thisid ) {
			res.send(arrEmployees[i])
			console.log(arrEmployees[i])
			break
		}
	}
	if (i!=thisid) {
		res.send('not found')
	}
}

function putEmployees (req, res, next) {
	body = req.body
	console.log('rest: put: '+req.body)
	var thisid = parseInt(req.params.id)
	for (var i=0;i<=arrEmployees.length-1;i++) {
		if (arrEmployees[i].id == thisid ) {
			arrEmployees[i].fname = body.fname
			arrEmployees[i].lname = body.lname
			res.send(arrEmployees[i])
			break
		}
	}
}

function delEmployees (req, res, next) {
	var thisid = parseInt(req.params.id)
	console.log('rest: delete: '+thisid)
	if (arrEmployees.length > -1) {
		for (var i=0;arrEmployees.length-1;i++) {
			if (arrEmployees[i].id == thisid ) {
				arrEmployees.splice(i,1)
				res.send(arrEmployees)
				break
			}
		} 
	}
	else {
		res.send(arrEmployees)
	}
}

//routes
restserver.post('/Employees', postEmployees) 
restserver.get('/Employees', getEmployees) 
restserver.get('/Employees/:id', getEmployee) 
restserver.put('/Employees/:id', putEmployees)
restserver.del('/Employees/:id', delEmployees)

