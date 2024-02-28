const mongoose=require('mongoose')
const ObjectId= mongoose.Schema.Types.ObjectId
const CategorySchema=mongoose.Schema({
    categoryId:{
        type:String
    },
    categoryName:{
        type:String,
        required:true
    },
    categoryDescription:{
        type:String
    },
    isBlocked:{
        type:String
    }

})

module.exports=mongoose.model('Category',CategorySchema)