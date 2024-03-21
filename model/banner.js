const mongoose=require('mongoose')
const ObjectId=mongoose.Schema.Types.ObjectId
const BannerSchema=mongoose.Schema({
 bannerName:{
    type:String
 },
 bannerType:{
    type:String
 },
 startDate:{
    type:Array
 },
 endDate:{
    type:Array
 },
 bannerImage:{
    type:Array
 },
 bannerDescription:{
    type:String
 },
 location:{
   page:{
      type:String
   },
   position:{
      type:String
   }
 }


},
{
    timestamps: true
})


module.exports=mongoose.model('Banner',BannerSchema)