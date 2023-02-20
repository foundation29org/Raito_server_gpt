// functions for each call of the api on social-info. Use the social-info model

'use strict'

// add the social-info model
const Quality = require('../../../models/quality')
const Patient = require('../../../models/patient')
const crypt = require('../../../services/crypt')

async function getQualitiesDates (req, res){
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
	const posts = await Quality.find({"createdBy": patientId}).sort({date: 1});
	var oldProm = {};
	var enc = false;
	if(posts.length>0){
		for (var i = 0; i < posts.length && !enc; i++) {
			if(posts[i].date<pastDateDateTime){
				oldProm = posts[i];
			}else{
				enc = true;
			}
		}
	}
	
	Quality.find({"createdBy": patientId, "date":{"$gte": pastDateDateTime, "$lt": actualDateTime}}, {"createdBy" : false},(err, eventsdb) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		var listEventsdb = [];
		eventsdb.forEach(function(eventdb) {
			listEventsdb.push(eventdb);
		});
		res.status(200).send({qualities:listEventsdb, old:oldProm})
	});
}

function getQualities (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	//Quality.find({createdBy: patientId}).sort({ start : 'desc'}).exec(function(err, eventsdb){
		Quality.find({"createdBy": patientId}, {"createdBy" : false},(err, eventsdb) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		var listEventsdb = [];

		eventsdb.forEach(function(eventdb) {
			listEventsdb.push(eventdb);
		});
		res.status(200).send(listEventsdb)
	});
}


function saveQuality (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	let eventdb = new Quality()
	eventdb.score = req.body.score;
	eventdb.items = req.body.items;
	eventdb.index = req.body.index;
	eventdb.responses = req.body.responses;
	eventdb.createdBy = patientId

	// when you save, returns an id in eventdbStored to access that Quality
	eventdb.save((err, eventdbStored) => {
		if (err) {
			return res.status(500).send({message: `Failed to save in the database: ${err} `})
		}
		if(eventdbStored){
			res.status(200).send({message: 'Done'})
		}
	})


}

function deleteQuality (req, res){
	let qualityId=req.params.qualityId

	Quality.findById(qualityId, (err, qualitydb) => {
		if (err) return res.status(500).send({message: `Error deleting the Quality: ${err}`})
		if (qualitydb){
			qualitydb.remove(err => {
				if(err) return res.status(500).send({message: `Error deleting the Quality: ${err}`})
				res.status(200).send({message: `The Quality has been deleted`})
			})
		}else{
			 return res.status(404).send({code: 208, message: `Error deleting the Quality: ${err}`})
		}

	})
}

module.exports = {
	getQualitiesDates,
	getQualities,
	saveQuality,
	deleteQuality
}
