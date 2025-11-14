let mongoose=require('mongoose');
// const { stringAt } = require('pdfkit/js/data');
let Schema = mongoose.Schema;
let noticeSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true } 
})
let noticeModel = mongoose.model('Notice', noticeSchema);
module.exports=noticeModel