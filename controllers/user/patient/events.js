// functions for each call of the api on social-info. Use the social-info model

'use strict'

// add the social-info model
const Events = require('../../../models/events')
const Patient = require('../../../models/patient')
const crypt = require('../../../services/crypt')

function getEventsDate (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	var period = 31;
	if(req.body.rangeDate == 'quarter'){
		period = 90;
	}else if(req.body.rangeDate == 'year'){
		period = 365;
	}
	var actualDate = new Date();
	var actualDateTime = actualDate.getTime();

	var pastDate=new Date(actualDate);
    pastDate.setDate(pastDate.getDate() - period);
	var pastDateDateTime = pastDate.getTime();
	//Events.find({createdBy: patientId}).sort({ start : 'desc'}).exec(function(err, eventsdb){
	Events.find({"createdBy": patientId, "date":{"$gte": pastDateDateTime, "$lt": actualDateTime}}, {"createdBy" : false},(err, eventsdb) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		var listEventsdb = [];

		eventsdb.forEach(function(eventdb) {
			listEventsdb.push(eventdb);
		});
		res.status(200).send(listEventsdb)
	});
}

function getEvents (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	//Events.find({createdBy: patientId}).sort({ start : 'desc'}).exec(function(err, eventsdb){
	Events.find({"createdBy": patientId}, {"createdBy" : false},(err, eventsdb) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		var listEventsdb = [];

		eventsdb.forEach(function(eventdb) {
			listEventsdb.push(eventdb);
		});
		res.status(200).send(listEventsdb)
	});
}


function saveEvent (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	let eventdb = new Events()
	eventdb.type = req.body.type
	eventdb.date = req.body.date
	eventdb.name = req.body.name
	eventdb.notes = req.body.notes
	eventdb.createdBy = patientId

	// when you save, returns an id in eventdbStored to access that social-info
	eventdb.save((err, eventdbStored) => {
		if (err) {
			res.status(500).send({message: `Failed to save in the database: ${err} `})
		}
		if(eventdbStored){
			//podría devolver eventdbStored, pero no quiero el field createdBy, asi que hago una busqueda y que no saque ese campo
			Events.findOne({"createdBy": patientId}, {"createdBy" : false }, (err, eventdb2) => {
				if (err) return res.status(500).send({message: `Error making the request: ${err}`})
				if(!eventdb2) return res.status(202).send({message: `There are no eventdb`})
				res.status(200).send({message: 'Eventdb created', eventdb: eventdb2})
			})
		}


	})


}

function updateEvent (req, res){
	let eventId= req.params.eventId;
	let update = req.body

	Events.findByIdAndUpdate(eventId, update, {select: '-createdBy', new: true}, (err,eventdbUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})

		res.status(200).send({message: 'Eventdb updated', eventdb: eventdbUpdated})

	})
}


function deleteEvent (req, res){
	let eventId=req.params.eventId

	Events.findById(eventId, (err, eventdb) => {
		if (err) return res.status(500).send({message: `Error deleting the event: ${err}`})
		if (eventdb){
			eventdb.remove(err => {
				if(err) return res.status(500).send({message: `Error deleting the eventdb: ${err}`})
				res.status(200).send({message: `The eventdb has been deleted`})
			})
		}else{
			 return res.status(404).send({code: 208, message: `Error deleting the eventdb: ${err}`})
		}

	})
}

async function saveMassiveEvent (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	var promises = [];
	if (req.body.length > 0) {
		for (var i = 0; i<(req.body).length;i++){
			var actualevent = (req.body)[i];
			promises.push(testOneEvent(actualevent, patientId));
		}
	}else{
		res.status(200).send({message: 'Eventdb created', eventdb: 'epa'})
	}


	await Promise.all(promises)
			.then(async function (data) {
				res.status(200).send({message: 'Eventdb created', eventdb: 'epa'})
			})
			.catch(function (err) {
				console.log('Manejar promesa rechazada (' + err + ') aquí.');
				return null;
			});
	

}

async function testOneEvent(actualevent, patientId){
	var functionDone = false;
	/*await Events.findOne({'type': actualseizure.type, 'createdBy': patientId, ''}, (err, eventdb2) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		if(!eventdb2){
			let eventdb = new Events()
			eventdb.type = actualevent.type
			eventdb.date = actualevent.date
			eventdb.name = actualevent.name
			eventdb.notes = actualevent.notes
			eventdb.createdBy = patientId
			var res1 = saveOneEvent(eventdb)
			functionDone = true;
		}else{
			functionDone = true;
		}
	})*/
	let eventdb = new Events()
	eventdb.type = actualevent.type
	eventdb.date = actualevent.date
	eventdb.name = actualevent.name
	eventdb.notes = actualevent.notes
	eventdb.createdBy = patientId
	var res1 = saveOneEvent(eventdb)
	// when you save, returns an id in eventdbStored to access that social-info
	functionDone = true;
	return functionDone
}

async function saveOneEvent(eventdb){
	var functionDone2 = false;
	await eventdb.save((err, eventdbStored) => {
		if (err) {
			res.status(500).send({message: `Failed to save in the database: ${err} `})
		}
		functionDone2 = true;
	})
	return functionDone2;
}

module.exports = {
	getEventsDate,
	getEvents,
	saveEvent,
	updateEvent,
	deleteEvent,
	saveMassiveEvent
}
