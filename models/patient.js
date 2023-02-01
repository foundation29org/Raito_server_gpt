// Patient schema
'use strict'

const mongoose = require ('mongoose')
const Schema = mongoose.Schema
const User = require('./user')

const { conndbaccounts } = require('../db_connect')

const SiblingSchema = Schema({
	gender: String,
	affected: String //affected: { type: String, enum: ['yes', 'no']} si hacemos validacion de que no pueda ser null, igual poner el enum
})

const ParentSchema = Schema({
	highEducation: String,
	profession: String,
	relationship: String,
	nameCaregiver: String
})

const generalShareSchema = Schema({
	data:{patientInfo:{type: Boolean, default: false}, medicalInfo:{type: Boolean, default: false},devicesInfo:{type: Boolean, default: false},genomicsInfo:{type: Boolean, default: false}},
	notes: {type: String, default: ''},
	date: {type: Date, default: Date.now},
	token: {type: String, default: ''}
})

const individualShareSchema = Schema({
	data:{patientInfo:{type: Boolean, default: false}, medicalInfo:{type: Boolean, default: false},devicesInfo:{type: Boolean, default: false},genomicsInfo:{type: Boolean, default: false}},
	notes: {type: String, default: ''},
	date: {type: Date, default: Date.now},
	token: {type: String, default: ''},
	idUser: {type: String, default: null},
	status: {type: String, default: 'Pending'},
	verified: {type: String, default: ''}
})

const PatientSchema = Schema({
	wizardCompleted: {type: Boolean, default: false},
	patientName: {type: String, default: ''},
	surname: {type: String, default: ''},
	birthDate: Date,
	citybirth: String,
	provincebirth: String,
	countrybirth: String,
	street: {type: String, default: null},
	postalCode: {type: String, default: null},
	city: {type: String, default: null},
	province: {type: String, default: null},
	country: {type: String, default: null},
	phone1: String,
	phone2: String,
	lat: {type: String, default: ''},
	lng: {type: String, default: ''},
	phone1: {type: String, default: null},
	phone2: {type: String, default: null},
	gender: {type: String, default: null},
	siblings: [SiblingSchema],
	parents: [ParentSchema],
	createdBy: { type: Schema.Types.ObjectId, ref: "User"},
	death: Date,
	notes: {type: String, default: ''},
	needs: {type: String, default: ''},
	isArchived: {type: Boolean, default: false},
	sharing: {type: Object, default: []},
	status: {type: String, default: null},
	relationship: String,
	lastAccess: {type: Date, default: Date.now},
	creationDate: {type: Date, default: Date.now},
	group: { type: String, default: null},
	consentgroup: {type: String, default: 'false'},
	generalShare:{
		type: generalShareSchema, default:{
			data:{patientInfo:false, medicalInfo:false,devicesInfo:false,genomicsInfo:false},
			notes: '',
			date: null,
			token: ''
		}
	},
	customShare: [generalShareSchema],
	individualShare: [individualShareSchema]
})

module.exports = conndbaccounts.model('Patient',PatientSchema)
// we need to export the model so that it is accessible in the rest of the app
