const mongoose=require('mongoose')
const ObjectId=mongoose.Schema.Types.ObjectId
const otpSchema=mongoose.Schema({
    otp:{
        type:Number,
        required:true
},
    userId:{
        type:ObjectId,
        required:true
},
    isVerified:{   
        type:String,
        default:false
},
    createDate:{
        type:Date,
        default:Date.now,
        expires:60*1
}

})


module.exports=mongoose.model('OTP',otpSchema)