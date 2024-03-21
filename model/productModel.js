const mongoose=require('mongoose')
const ObjectId= mongoose.Schema.Types.ObjectId
const productSchema=new mongoose.Schema({

    productIDNumber:{
        type:String
    },
    productName:{
        type:String,
        required:true,
        unique:true
    },
    productCategory:{
        type:ObjectId,
        required:true,
        ref:"Category"
    },
    productPrice:{
        type:Number,
        required:true
    }, 
    productQuantity:{
        type:Number,
        required:true
    },
    productImage:{
        type:Array,
        
    },
    productDescription:{
        type:String,
        required:true
    },
    productIsBlocked:{
        type:Boolean,
        required:true
    },
    createdDate:{
        type:Date,
        required:true
    },
    lastUpdated:{
        type:Date,
        required:true
    },
    isCategoryBlocked:{
        type:Boolean,
        required:true
    },
    isDelete:{
        type:Boolean,
        required:true
    },
    productRating:{
       rating:[Number],
       userName:[String],
       review:[String]
    },
    productBrand:{
        type:String,
        required:true
    },
    productOffer:{
        type:Object
    }  
})

module.exports=mongoose.model('Products',productSchema)