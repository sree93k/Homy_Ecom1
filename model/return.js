const mongoose=require('mongoose')
const ObjectId=mongoose.Schema.Types.ObjectId
const returnItemSchema=mongoose.Schema({
userId:{
    type:ObjectId
},
 productId:{
    type:ObjectId
 },
 orderId:{
    type:ObjectId
 },
 returnReason:{
    type:String
 },
 returnDate:{
    type:Date
 },
 returnStatus:{
    type:String
 }

})

module.exports=mongoose.model('returnItems',returnItemSchema)
