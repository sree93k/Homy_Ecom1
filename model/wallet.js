const mongoose=require('mongoose')
const ObjectId=mongoose.Schema.Types.ObjectId
const WalletSchema=mongoose.Schema({
 userId:{
    type:ObjectId
 },
 balance:{
    type:Number,
 },
 transaction:{
    type:Array
 }

})

module.exports=mongoose.model('Wallet',WalletSchema)
