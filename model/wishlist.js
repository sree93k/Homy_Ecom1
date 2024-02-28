const mongoose=require('mongoose')
const ObjectId=mongoose.Schema.Types.ObjectId
const WishListSchema=mongoose.Schema({
 userId:{
    type:ObjectId
 },
 productId:{
    type:Array,
    ref:"Products"
 }

})

module.exports=mongoose.model('WishList',WishListSchema)
