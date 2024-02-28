const mongoose=require('mongoose')
const ObjectId=mongoose.Schema.Types.ObjectId
const orderSchema=mongoose.Schema({
    orderId:{
        type:String,
        required:true
     },
        userId:{
        type:ObjectId,
        required:true
     },
     payment:{
        type:String,
        required:true
     },
     deliveryAddress:{
           type:ObjectId,
           required:true,
           ref:"Address"
     },
     orderDate:{
           type:Date,
           required:true
     },
        productItem:{
           type:Array,
           required:true,
           ref:"Products"
     },
     productStatus:{
            type:Array
     },
     productPrice:{
            type:Array
     },
     productQuantity:{
            type:Array,
     },
     cartProducts:{
            type:ObjectId,
            ref:'OrderItems'

     },
     amount:{
           type:Number,   
     },
     orderStatus:{
           type:Array,
           required:true
     },
     shippingDate:{
           type:Date,
           required:true
     },
     deliveryDate:{
           type:Date,
           required:true
     }

})

module.exports=mongoose.model('Order',orderSchema)