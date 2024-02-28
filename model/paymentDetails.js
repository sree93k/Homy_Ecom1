const mongoose=require('mongoose')
const ObjectId= mongoose.Schema.Types.ObjectId
const PaymentSchema=mongoose.Schema({
    paymentMethod:{
        type:String

    },
    paymentAmount:{
        type:Number
    },
    paymentId:{
        type:String,
        required:true
    },
    orderId:{
        type:String
    },
    signature:{
        type:String
    },
    userId:{
        type:ObjectId
    },
    paymentTime:{
        type:Date
    }

})

module.exports=mongoose.model('Payment',PaymentSchema)