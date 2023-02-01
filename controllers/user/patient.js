// functions for each call of the api on patient. Use the patient model

'use strict'

// add the patient model
const Patient = require('../../models/patient')
const User = require('../../models/user')
const Phenotype = require ('../../models/phenotype')
const Group = require('../../models/group')
const Session = require('../../models/session')
const crypt = require('../../services/crypt')
const vcServiceCtrl = require('../../services/vc.js')
const f29azureService = require("../../services/f29azure")

/**
 * @api {get} https://raito.care/api/patients-all/:userId Get patient list of a user
 * @apiName getPatientsUser
 * @apiDescription This method read the patient list of a user. For each patient you have, you will get: patientId, name, and last name.
 * @apiGroup Patients
 * @apiVersion 1.0.0
 * @apiExample {js} Example usage:
 *   this.http.get('https://raito.care/api/patients-all/'+userId)
 *    .subscribe( (res : any) => {
 *      console.log('patient list: '+ res.listpatients);
 *      if(res.listpatients.length>0){
 *        console.log("patientId" + res.listpatients[0].sub +", Patient Name: "+ res.listpatients[0].patientName+", Patient surname: "+ res.listpatients[0].surname);
 *      }
 *     }, (err) => {
 *      ...
 *     }
 *
 * @apiHeader {String} authorization Users unique access-key. For this, go to  [Get token](#api-Access_token-signIn)
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciPgDIUzI1NiJ9.eyJzdWIiOiI1M2ZlYWQ3YjY1YjM0ZTQ0MGE4YzRhNmUyMzVhNDFjNjEyOThiMWZjYTZjMjXkZTUxMTA9OGVkN2NlODMxYWY3IiwiaWF0IjoxNTIwMzUzMDMwLCJlcHAiOjE1NTE4ODkwMzAsInJvbGUiOiJVc2VyIiwiZ3JvdDEiOiJEdWNoZW5uZSBQYXJlbnQgUHJfrmVjdCBOZXRoZXJsYW5kcyJ9.MloW8eeJ857FY7-vwxJaMDajFmmVStGDcnfHfGJx05k"
 *     }
 * @apiParam {String} userId User unique ID. More info here:  [Get token and userId](#api-Access_token-signIn)
 * @apiSuccess {Object} listpatients You get a list of patients (usually only one patient), with your patient id, name, and surname.
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {"listpatients":
 *  {
 *   "sub": "1499bb6faef2c95364e2f4tt2c9aef05abe2c9c72110a4514e8c4c3fb038ff30",
 *   "patientName": "Jhon",
 *   "surname": "Doe"
 *  },
 *  {
 *   "sub": "5499bb6faef2c95364e2f4ee2c9aef05abe2c9c72110a4514e8c4c4gt038ff30",
 *   "patientName": "Peter",
 *   "surname": "Tosh"
 *  }
 * }
 *
 */

function getPatientsUser (req, res){
	let userId= crypt.decrypt(req.params.userId);


	User.findById(userId, {"_id" : false , "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "lastLogin" : false}, (err, user) => {
		if (err) return res.status(500).send({message: 'Error making the request:'})
		if(!user) return res.status(404).send({code: 208, message: 'The user does not exist'})

		if(user.role == 'User'){
			Patient.find({"createdBy": userId},(err, patients) => {
				if (err) return res.status(500).send({message: `Error making the request: ${err}`})

				var listpatients = [];

				patients.forEach(function(u) {
					var id = u._id.toString();
					var idencrypt= crypt.encrypt(id);
					listpatients.push({sub:idencrypt, patientName: u.patientName, surname: u.surname, birthDate: u.birthDate, gender: u.gender, country: u.country, group: u.group});
				});

				//res.status(200).send({patient, patient})
				// if the two objects are the same, the previous line can be set as follows
				res.status(200).send({listpatients})
			})
		}else if(user.role == 'Clinical' || user.role == 'SuperAdmin' || user.role == 'Admin'){

			//debería de coger los patientes creados por ellos, más adelante, habrá que meter tb los pacientes que les hayan datos permisos
			Patient.find({"createdBy": userId},(err, patients) => {
				if (err) return res.status(500).send({message: `Error making the request: ${err}`})

				var listpatients = [];

				patients.forEach(function(u) {
					var id = u._id.toString();
					var idencrypt= crypt.encrypt(id);
					listpatients.push({sub:idencrypt, patientName: u.patientName, surname: u.surname, isArchived: u.isArchived, birthDate: u.birthDate, gender: u.gender, country: u.country, group: u.group});
				});

				//res.status(200).send({patient, patient})
				// if the two objects are the same, the previous line can be set as follows
				res.status(200).send({listpatients})
			})
		}else{
			res.status(401).send({message: 'without permission'})
		}
	})


}


/**
 * @api {get} https://raito.care/api/patients/:patientId Get patient
 * @apiName getPatient
 * @apiDescription This method read data of a Patient
 * @apiGroup Patients
 * @apiVersion 1.0.0
 * @apiExample {js} Example usage:
 *   this.http.get('https://raito.care/api/patients/'+patientId)
 *    .subscribe( (res : any) => {
 *      console.log('patient info: '+ res.patient);
 *     }, (err) => {
 *      ...
 *     }
 *
 * @apiHeader {String} authorization Users unique access-key. For this, go to  [Get token](#api-Access_token-signIn)
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciPgDIUzI1NiJ9.eyJzdWIiOiI1M2ZlYWQ3YjY1YjM0ZTQ0MGE4YzRhNmUyMzVhNDFjNjEyOThiMWZjYTZjMjXkZTUxMTA9OGVkN2NlODMxYWY3IiwiaWF0IjoxNTIwMzUzMDMwLCJlcHAiOjE1NTE4ODkwMzAsInJvbGUiOiJVc2VyIiwiZ3JvdDEiOiJEdWNoZW5uZSBQYXJlbnQgUHJfrmVjdCBOZXRoZXJsYW5kcyJ9.MloW8eeJ857FY7-vwxJaMDajFmmVStGDcnfHfGJx05k"
 *     }
 * @apiParam {String} patientId Patient unique ID. More info here:  [Get patientId](#api-Patients-getPatientsUser)
 * @apiSuccess {string="male","female"} gender Gender of the Patient.
 * @apiSuccess {String} phone1 Phone number of the Patient.
 * @apiSuccess {String} phone2 Other phone number of the Patient.
 * @apiSuccess {String} country Country code of residence of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiSuccess {String} province Province or region code of residence of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiSuccess {String} city City of residence of the Patient.
 * @apiSuccess {String} postalCode PostalCode of residence of the Patient.
 * @apiSuccess {String} street Street of residence of the Patient.
 * @apiSuccess {String} countrybirth Country birth of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiSuccess {String} provincebirth Province birth of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiSuccess {String} citybirth City birth of the Patient.
 * @apiSuccess {Date} birthDate Date of birth of the patient.
 * @apiSuccess {String} patientName Name of the Patient.
 * @apiSuccess {String} surname Surname of the Patient.
 * @apiSuccess {Object} parents Data about parents of the Patient. The highEducation field can be ... The profession field is a free field
 * @apiSuccess {Object} siblings Data about siblings of the Patient. The affected field can be yes or no. The gender field can be male or female
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {"patient":
 *   {
 *     "gender":"male",
 *     "phone2":"",
 *     "phone1":"",
 *     "country":"NL",
 *     "province":"Groningen",
 *     "city":"narnias",
 *     "postalCode":"",
 *     "street":"",
 *     "countrybirth":"SL",
 *     "provincebirth":"Barcelona",
 *     "citybirth":"narnia",
 *     "birthDate":"1984-06-13T00:00:00.000Z",
 *     "surname":"aa",
 *     "patientName":"aa",
 *     "parents":[{"_id":"5a6f4b71f600d806044f3ef5","profession":"","highEducation":""}],
 *     "siblings":[{"_id":"5a6f4b71f600d806044f3ef4","affected":null,"gender":""}]
 *   }
 * }
 *
 */

function getPatient (req, res){
	let patientId= crypt.decrypt(req.params.patientId);

	Patient.findById(patientId, {"_id" : false , "createdBy" : false }, (err, patient) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		if(!patient) return res.status(202).send({message: `The patient does not exist`})

		res.status(200).send({patient})
	})
}


/**
 * @api {put} https://raito.care/api/patients/:patientId Update Patient
 * @apiName updatePatient
 * @apiDescription This method allows to change the data of a patient.
 * @apiGroup Patients
 * @apiVersion 1.0.0
 * @apiExample {js} Example usage:
 *   var patient = {patientName: '', surname: '', street: '', postalCode: '', citybirth: '', provincebirth: '', countrybirth: null, city: '', province: '', country: null, phone1: '', phone2: '', birthDate: null, gender: null, siblings: [], parents: []};
 *   this.http.put('https://raito.care/api/patients/'+patientId, patient)
 *    .subscribe( (res : any) => {
 *      console.log('patient info: '+ res.patientInfo);
 *     }, (err) => {
 *      ...
 *     }
 *
 * @apiHeader {String} authorization Users unique access-key. For this, go to  [Get token](#api-Access_token-signIn)
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciPgDIUzI1NiJ9.eyJzdWIiOiI1M2ZlYWQ3YjY1YjM0ZTQ0MGE4YzRhNmUyMzVhNDFjNjEyOThiMWZjYTZjMjXkZTUxMTA9OGVkN2NlODMxYWY3IiwiaWF0IjoxNTIwMzUzMDMwLCJlcHAiOjE1NTE4ODkwMzAsInJvbGUiOiJVc2VyIiwiZ3JvdDEiOiJEdWNoZW5uZSBQYXJlbnQgUHJfrmVjdCBOZXRoZXJsYW5kcyJ9.MloW8eeJ857FY7-vwxJaMDajFmmVStGDcnfHfGJx05k"
 *     }
 * @apiParam {String} patientId Patient unique ID. More info here:  [Get patientId](#api-Patients-getPatientsUser)
 * @apiParam (body) {string="male","female"} gender Gender of the Patient.
 * @apiParam (body) {String} phone1 Phone number of the Patient.
 * @apiParam (body) {String} phone2 Other phone number of the Patient.
 * @apiParam (body) {String} country Country code of residence of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiParam (body) {String} province Province or region code of residence of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiParam (body) {String} city City of residence of the Patient.
 * @apiParam (body) {String} [postalCode] PostalCode of residence of the Patient.
 * @apiParam (body) {String} [street] Street of residence of the Patient.
 * @apiParam (body) {String} countrybirth Country birth of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiParam (body) {String} provincebirth Province birth of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiParam (body) {String} citybirth City birth of the Patient.
 * @apiParam (body) {Date} birthDate Date of birth of the patient.
 * @apiParam (body) {String} patientName Name of the Patient.
 * @apiParam (body) {String} surname Surname of the Patient.
 * @apiParam (body) {Object} [parents] Data about parents of the Patient. The highEducation field can be ... The profession field is a free field
 * @apiParam (body) {Object} [siblings] Data about siblings of the Patient. The affected field can be yes or no. The gender field can be male or female
 * @apiSuccess {Object} patientInfo patientId, name, and surname.
 * @apiSuccess {String} message If the patient has been created correctly, it returns the message 'Patient updated'.
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {"patientInfo":
 *  {
 *   "sub": "1499bb6faef2c95364e2f4tt2c9aef05abe2c9c72110a4514e8c4c3fb038ff30",
 *   "patientName": "Jhon",
 *   "surname": "Doe"
 *  },
 * "message": "Patient updated"
 * }
 *
 */

function updatePatient (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	let update = req.body
  if(req.body.deleteConsent!=undefined){
	if(req.body.deleteConsent){
		req.body.consentgroup='false';
		Session.find({"createdBy": req.params.patientId, "type": 'Organization'},async (err, sessions) => {
			if (err) console.log({message: `Error deleting the feels: ${err}`})
			if(sessions.length>0){
				sessions.forEach(function(session) {
					session.remove(err => {
						if(err) console.log({message: `Error deleting the feels: ${err}`})
					})
				});
			}
		})
	}
  }

  Patient.findByIdAndUpdate(patientId, { gender: req.body.gender, birthDate: req.body.birthDate, patientName: req.body.patientName, surname: req.body.surname, relationship: req.body.relationship, country: req.body.country, group: req.body.group, consentgroup: req.body.consentgroup }, {new: true}, async (err,patientUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		var id = patientUpdated._id.toString();
		var idencrypt= crypt.encrypt(id);
		var patientInfo = {sub:idencrypt, patientName: patientUpdated.patientName, surname: patientUpdated.surname, birthDate: patientUpdated.birthDate, gender: patientUpdated.gender, country: patientUpdated.country, group: patientUpdated.group, consentgroup: patientUpdated.consentgroup};
		let containerName = (idencrypt).substr(1);
		var result = await f29azureService.createContainers(containerName);
		res.status(200).send({message: 'Patient updated', patientInfo})

	})
}

function consentgroup (req, res){

	let patientId= crypt.decrypt(req.params.patientId);//crypt.decrypt(req.params.patientId);
	var newConsent = req.body.consentgroup;
	if(req.body.consentgroup == 'Pending'){
		newConsent = 'true'
	}else if(req.body.consentgroup == 'true'){
		newConsent = 'Pending'
	}
	Patient.findByIdAndUpdate(patientId, { consentgroup: newConsent }, {select: '-createdBy', new: true}, (err,patientUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		if(req.body.consentgroup == 'true'){
			//get group name
			Group.findOne({ '_id': patientUpdated.group }, function (err, group) {
				var info = {patientId: req.params.patientId, groupName: group.name, type: 'Organization'}
				Session.find({"createdBy": req.params.patientId, "type": 'Organization'},async (err, sessions) => {
                    if (err) return res.status(500).send({message: `Error making the request: ${err}`})
                    if(sessions.length>0){
                        var foundSession = false;
                        var infoSession = {};
                      for (var i = 0; i < sessions.length; i++) {
                        if(sessions[i].sharedWith==group.name){
                            foundSession = true;
                            infoSession == sessions[i];
                        }
                      }
                      if(!foundSession){
                        try {
                            var data = await generateQR(info);
                            return res.status(200).send({ message: 'qrgenerated', data: data })
                        } catch (e) {
                            console.error("Error: ", e);
                            return res.status(200).send({ message: 'Error', data: e })
                        }
                      }else{
                        //delete and create new one
                        sessions.forEach(function(session) {
                            session.remove(err => {
                                if(err) console.log({message: `Error deleting the feels: ${err}`})
                            })
                        });
                        var data = await generateQR(info);
                        return res.status(200).send({ message: 'qrgenerated', data: data })
                        /*if(infoSession.sessionData.message!='Credential successfully issued'){
                            res.status(200).send({infoSession})
                        }else{
                            res.status(200).send({ message: 'individuals share updated' })
                        }*/
                      }
                    }else{
                        try {
                            var data = await generateQR(info);
                            return res.status(200).send({ message: 'qrgenerated', data: data })
                        } catch (e) {
                            console.error("Error: ", e);
                            return res.status(200).send({ message: 'Error', data: e })
                        }
                    }
                  
                  })
			})
		}else if(req.body.consentgroup == 'false'){
			//delete session
			Session.find({"createdBy": req.params.patientId, "type": 'Organization'},async (err, sessions) => {
				//delete and create new one
				sessions.forEach(function(session) {
					//revokeVC(session)
					session.remove(err => {
						if(err) console.log({message: `Error deleting the sessions: ${err}`})
					})
				});
				res.status(200).send({message: 'consent changed', consent: newConsent})
			})
		}else{
			res.status(200).send({message: 'consent changed', consent: newConsent})
		}
		

	})
}
function revokeVC(session){
 //searchCredential

	var claimvalue = session._id;
	var contractid = "NTBiZGIyMjctMTAwZC00ODA4LWI0YjktYWFjNDI2ZTI4YzRmdmVyaWZpZWRvcmdhbml6YXRpb25yYWl0bw";
	var crypto = require('crypto');
	var input = contractid + claimvalue;
	var inputasbytes = Encoding.UTF8.GetBytes(input);
	const hash = crypto.createHash('sha256').update(inputasbytes).digest('base64');

	var options = {
		'method': 'GET',
		'url': "https://verifiedid.did.msidentity.com/v1.0/verifiableCredentials/authorities/:authorityId/contracts/NTBiZGIyMjctMTAwZC00ODA4LWI0YjktYWFjNDI2ZTI4YzRmdmVyaWZpZWRvcmdhbml6YXRpb25yYWl0bw/credentials?filter=indexclaim",
		'headers': {
		'Content-Type': 'Application/json',
		'Authorization': auth
		},
		body: JSON.stringify(requestConfigFile)
	
	};
	request(options, function (error, response) {
		if (error) throw new Error(error);
		var respJson = JSON.parse(response.body)
	});

	//revokeCredential
}

async function generateQR(info) {
	return new Promise(async function (resolve, reject) {

        var promises = [];
		promises.push(vcServiceCtrl.createIssuerOrganization(info));
		await Promise.all(promises)
			.then(async function (data) {
				resolve(data)
			})
			.catch(function (err) {
				console.log('Manejar promesa rechazada (' + err + ') aquí.');
				reject('Manejar promesa rechazada (' + err + ') aquí.');
			});

		

	});
}

function getConsentGroup (req, res){

	let patientId= crypt.decrypt(req.params.patientId);//crypt.decrypt(req.params.patientId);

	Patient.findById(patientId, {"_id" : false , "createdBy" : false }, (err,patient) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
			res.status(200).send({consentgroup: patient.consentgroup})

	})
}

function setBirthDate (req, res){

	let patientId= crypt.decrypt(req.params.patientId);

	Patient.findByIdAndUpdate(patientId, { birthDate: req.body.birthDate }, {select: '-createdBy', new: true}, (err,patientUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})

			res.status(200).send({message: 'birthDate changed'})

	})
}

function setGender (req, res){

	let patientId= crypt.decrypt(req.params.patientId);

	Patient.findByIdAndUpdate(patientId, { gender: req.body.gender }, {select: '-createdBy', new: true}, (err,patientUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})

			res.status(200).send({message: 'gender changed'})

	})
}

function setWizardCompleted (req, res){

	let patientId= crypt.decrypt(req.params.patientId);

	Patient.findByIdAndUpdate(patientId, { wizardCompleted: req.body.wizardCompleted }, {select: '-createdBy', new: true}, (err,patientUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})

			res.status(200).send({message: 'gender changed'})

	})
}

module.exports = {
	getPatientsUser,
	getPatient,
	updatePatient,
  consentgroup,
  getConsentGroup,
  setBirthDate,
  setGender,
  setWizardCompleted
}
