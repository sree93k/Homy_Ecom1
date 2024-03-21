const mongoose=require("mongoose")
const ObjectId= mongoose.Schema.Types.ObjectId
const { use } = require("../routes/userRoute")

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
},
    email:{
        type:String,
        required:true,
        unique:true
},
    mobile:{
        type:String,
        required:true
},
    password:{
        type:String,
        required:true
},
    dob:{
        type:String      
},
    gender:{
        type:String,
        default:false
},
    image:{
        type:Array,
        required:false
},
    isBlocked:{
        type:Boolean,
        default:false   
},
    createdDate:{
        type:Date,
        required:false
},
    lastLoginDate:{
        type:Date,
        required:false
},
    isVerified:{
        type:Boolean,
        required:true
    },
    totalCart:{
        type:Number,
        
    },
    deafultAddrss:{
        type:ObjectId,
        ref:"Address"
    },
    referrals:{
        type:Array
    },
    referralUserId:{
        type:ObjectId
    }

})

module.exports=mongoose.model("User",userSchema)


   
