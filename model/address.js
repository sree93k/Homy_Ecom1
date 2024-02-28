const mongoose=require('mongoose')
const ObjectId=mongoose.Schema.Types.ObjectId
const addressScheme=mongoose.Schema({
   userId:{
    type:ObjectId,
   },
    name:{
        type:String,
    },
    mobile:{
        type:Number,
    },
    pincode:{
        type:Number
    },
    locality:{
        type:String
    },
    address:{
        type:String
    },
    city:{
        type:String
    },
    state:{
        type:String
    },
    landmark:{
        type:String
    },
    alterMobile:{
        type:Number
    },
    addressType:{
        type:String
    }

})

module.exports=mongoose.model('Address',addressScheme)