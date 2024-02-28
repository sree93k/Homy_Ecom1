const mongoose=require('mongoose')
const ObjectId=mongoose.Schema.Types.ObjectId
const OfferSchema=mongoose.Schema({
 offerName:{
    type:String
 },
 offerType:{
    type:String
 },
 startDate:{
    type:Array
 },
 endDate:{
    type:Array
 },
 discountType:{
    type:String
 },
 discountValue:{
    type:Number
 },
 offerImage:{
    type:Array
 },
 offerDescription:{
    type:String
 }

})

module.exports=mongoose.model('Offer',OfferSchema)
