const mongoose=require('mongoose')
const ObjectId=mongoose.Schema.Types.ObjectId
const orderItemSchema=mongoose.Schema({
 productName:{
    type:Array
 },
 productPrice:{
    type:Array
 },
 productDescription:{
    type:Array
 },
 productQuantity:{
    type:Array
 }

})

module.exports=mongoose.model('OrderItems',orderItemSchema)
