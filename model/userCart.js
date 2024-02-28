const mongoose=require('mongoose')
const ObjectId= mongoose.Schema.Types.ObjectId
const UserCartSchema=mongoose.Schema({
   
    userId:{
        type:ObjectId
    },
    productId:{
        type:ObjectId,
        ref:'Products'
    },
    name:{
        type:String
    },
    description:{
        type:String
    },
    quantity:{
        type:Number
    },
    price:{
        type:Number
    },
    totalPrice:{
        type:Number
    },
    totalAmount:{
        type:Number
    },
    status:{
        type:String
    },
    couponValue:{
        type:Number,
    }
})

module.exports=mongoose.model('UserCarts',UserCartSchema)