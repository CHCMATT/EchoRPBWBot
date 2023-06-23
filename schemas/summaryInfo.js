let { Schema, model, models } = require('mongoose');

let reqString = {
	type: String,
	required: true,
};

let reqNum = {
	type: Number,
	required: true,
};

let d8SummaryInfoSchema = new Schema({
	summaryName: reqString,
	value: reqNum,
	msgId: String,
});

module.exports = models['d8SummaryInfo'] || model('d8SummaryInfo', d8SummaryInfoSchema);