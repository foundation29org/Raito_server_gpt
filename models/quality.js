// Medication schema
'use strict'

const mongoose = require ('mongoose');
const Schema = mongoose.Schema
const Patient = require('./patient')

const { conndbdata } = require('../db_connect')

const QualitySchema = Schema({
	score: String,
	items: {type: Object, default: {}},
	index: String,
	responses: {type: Object, default: {}},
	date: {type: Date, default: Date.now},
	createdBy: { type: Schema.Types.ObjectId, ref: "Patient"}
})

module.exports = conndbdata.model('Quality',QualitySchema)
// we need to export the model so that it is accessible in the rest of the app
