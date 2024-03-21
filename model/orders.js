const mongoose=require('mongoose')
const ObjectId=mongoose.Schema.Types.ObjectId
const orderSchema=mongoose.Schema({
    orderId:{
        type:String,
        required:true
     },
        userId:{
        type:ObjectId,
        required:true
     },
     payment:{
        type:String,
        required:true
     },
    //  deliveryAddress:{
    //        type:ObjectId,
    //        required:true,
    //        ref:"Address"
    //  },
    deliveryAddress:{
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
    },
     orderDate:{
           type:Date,
           required:true
     },
      productItem:{
           type:Array,
           required:true,
           ref:"Products"
     },
     productStatus:{
            type:Array
     },
     productPrice:{
            type:Array
     },
     productQuantity:{
            type:Array,
     },
     cartProducts:{
            type:ObjectId,
            ref:'OrderItems'
     },
     totalPrice:{
        type:Number
     },
     amount:{
           type:Number,   
     },
     orderStatus:{
           type:String,
           required:true
     },
     returnStatus:{
            type:Array,
            required:true
     },
     shippingDate:{
           type:Date,
           required:true
     },
     deliveryDate:{
           type:Date,
           required:true
     },
     coupon:{
            type:Object
     },
     offer:{
             type:Array
     },
     orderedItem: [{
      productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'product',
          required: true
      },
      quantity: {
          type: Number,
          required: true
      },
      productStatus: {
          type: String,
          default: "pending",
          required: true
      },
      returReason: {
          type: String,
      },
      productAmount: {
          type: Number,
          required: true
      },
      totalProductAmount: {
          type: Number,
          required: true
      },
      offerId: {
          type: mongoose.Schema.Types.ObjectId,
      },
      
  }],
  deliveryCharge:{
    type:Number,
    default:0
  }
},
{
    timestamps: true
})

module.exports=mongoose.model('Order',orderSchema)