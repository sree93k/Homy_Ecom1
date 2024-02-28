const mongoose=require('mongoose')
const ObjectId= mongoose.Schema.Types.ObjectId
const CouponSchema=mongoose.Schema({
    couponId:{
        type:String
    },
    couponDescription:{
        type:String, 
    },
    userLimit:{
        type:Number
    },
    expiryDate:{
        type:Date
    },
    startingDate:{
        type:Date
    },
    discountType:{
        type:String
    },
    discountValue:{
        type:Number
    },
    userUsage:{
        type:Number
    },
    isActivated:{
        type:Boolean
    }

})

module.exports=mongoose.model('Coupons',CouponSchema)