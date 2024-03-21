const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const config=require('../config/config')
const nodemailer = require("nodemailer");
const speakeasy = require("speakeasy");
const otpGenerator=require('otp-generator')
const OTP = require("../model/otpModel");
const otpModel = require("../model/otpModel");
const { render } = require("../routes/userRoute");
const Category=require('../model/category')
const Product=require('../model/productModel')
const Address=require('../model/address')
const UserCart=require('../model/userCart')
const Order=require('../model/orders')
const OrderItems=require('../model/orderItems')
const Payment=require('../model/paymentDetails')
const Return=require('../model/return')
const Coupon=require('../model/coupons')
const Wishlist=require('../model/wishlist')
const Wallet=require('../model/wallet')
const Razorpay=require('razorpay')
require("dotenv").config()
//sweet alert
const Swal=require('sweetalert2')
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const moment=require('moment');
const { application } = require("express");
const { createHash, createHmac } = require("crypto");
const crypto = require('crypto');
const { log } = require("console");

async function computeHmac()
{

const hmac=crypto.createHmac('sha256',process.env.KEY_SECRET)
return hmac
}

// generate random number for orderId
function generateRandomNumber() {
    // Generate a random number between 100000 and 999999
    return Math.floor(Math.random() * 900000) + 100000;
  }
  
  //order confirm
  const cashOnDelivery=async(req,res)=>{
    try {
      console.log("cash on delivery tart");
      res.set("Cache-control","no-store")
      const paymentMethod=req.body.paymentMethod
      console.log(paymentMethod);
     const deliveryCharge=req.body.deliveryCharge
     console.log("deliveryCharge is #######",deliveryCharge);
      const userId=new ObjectId(req.session.user_id)
      const userCart=await UserCart.find({userId:userId}).populate('productId')
      const userData=await User.findById({_id:userId}).populate('deafultAddrss')
      const randomNumber = generateRandomNumber();
      const currentDate = new Date();
      console.log(randomNumber); 
      const orderId=`HOC${randomNumber}`;
      console.log("OrderId is =",orderId);
      console.log("UserId",userId);
      console.log(userData._id);
      console.log(userData);
      console.log("Payment method",paymentMethod);
      console.log("Delivery Address",userData.deafultAddrss);
      console.log("order date",currentDate.toDateString());
      const productIds = userCart.map(cartItem => cartItem.productId._id);
      const productQty = userCart.map(cartQty => cartQty.quantity);
      const productPrices=userCart.map(cartPrice=>cartPrice.price)
      const productStatus=userCart.map(cartStatus=>cartStatus.status)

      const orderedItem = await userCart.map(item => ({
        productId: item.productId._id,
        quantity: item.quantity,
        totalProductAmount: item.totalPrice,
        offerId: item.offerId,
        productAmount: item.price,
        productStatus:"Pending"
    }))

    console.log("ORDERED ITEM IS @@@@@@@@", orderedItem);
      // const cartProducts=[productIds,productQty,productPrices]
      console.log("prodcutIDs ssss",productIds);
      console.log("producyt id length",productIds.length);

      for(let i=0;i<productIds.length;i++)
      { 
        let products=await Product.findById({_id:productIds[i]})
        let quantity= products.productQuantity
        quantity=quantity-productQty[i]
        products.productQuantity=quantity
        await products.save()
        console.log("success save ",i);
      }
      console.log("Stats",productStatus);
      const paymentData=new Payment({
        paymentMethod:paymentMethod,
        paymentAmount:userData.totalCart,
        paymentId:0,
        orderId:0,
        signature:0,
        userId:userId,
        paymentTime:currentDate
      })
    
      await paymentData.save()

      const newOrderItem=new OrderItems({
        productName:userCart.map(cartItem => cartItem.productId.productName),
        productPrice:userCart.map(cartItem => cartItem.productId.productPrice),
        productQuantity:userCart.map(cartItem => cartItem.productId.productQuantity),
        productDescription:userCart.map(cartItem => cartItem.productId.productDescription),
      })
      if(newOrderItem)
      {
        const newOrderItemID=await newOrderItem.save()
        console.log("newOrderItemID is >>>>>>",newOrderItemID);
        console.log(productQty);
      console.log("product id",productIds);
      console.log("total amount",userData.totalCart);
      console.log("order status = ","not dispatched yet");
      const shippingDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));
      console.log("shipping date",shippingDate);
     
      const deliveryDate = new Date(currentDate.getTime() + (5 * 24 * 60 * 60 * 1000));
      console.log("Current Date:", currentDate.toDateString());
      console.log("Dleievry date:", deliveryDate.toDateString());
      req.session.orderId=orderId
      let couponValue=0;

      if(req.session.couponValue)
      {
        couponValue=req.session.couponValue
      }
      
      let multipliedValues = productPrices.map((price, index) => price * productQty[index]);

      let amount=userData.totalCart+deliveryCharge
      console.log("amount is ",amount);
      // Calculate the sum of the multiplied values
      let totalPrice = multipliedValues.reduce((acc, curr) => acc + curr, 0);
      console.log("totalPrice",totalPrice);

      const deliveryAddress={
        name:userData.deafultAddrss.name,
        mobile:userData.deafultAddrss.mobile,
        pincode:userData.deafultAddrss.pincode,
        locality:userData.deafultAddrss.locality,
        address:userData.deafultAddrss.address,
        city:userData.deafultAddrss.city,
        state:userData.deafultAddrss.state,
        landmark:userData.deafultAddrss.landmark,
        alterMobile:userData.deafultAddrss.alterMobile,
        addressType:userData.deafultAddrss.addressType
      }
      console.log("all addresss",userData.deafultAddrss);
      console.log("the delivery address is",deliveryAddress);
      console.log("req.session.orderId",req.session.orderId);
      const newOrder=new Order({
        orderId:orderId,
        userId:userData._id,
        payment:paymentMethod,
        deliveryAddress:userData.deafultAddrss,
        orderDate:currentDate,
        productItem:productIds,
        cartProducts:newOrderItemID,
        productPrice:productPrices,
        productQuantity:productQty,
        totalPrice:totalPrice,
        amount:amount,
        orderStatus:"Ordered",
        shippingDate:shippingDate,
        deliveryDate:deliveryDate,
        productStatus:productStatus,
        coupon:couponValue,
        orderedItem:orderedItem,
        deliveryCharge:deliveryCharge
      })
      req.session.orderConfirmed=true
      req.session.checkout=false
      if(newOrder)
      {
        if(userData.referralUserId)
        {
          const referId=userData.referralUserId
          const referUserData=await User.findById({_id:referId})

            const userReferals={
              userName:userData.name,
              amount:100,
              date:new Date(),
            }
            referUserData.referrals.unshift(userReferals)
             await referUserData.save()
            const addToWallet={
              amount:100,
              type:"credit",
              date:new Date()
            }
            const referalUserWallet=await Wallet.findOne({userId:referId})
            referalUserWallet.transaction.unshift(addToWallet)
            referalUserWallet.balance+=100
            await referalUserWallet.save()

            const userWallet=await Wallet.findOne({userId:userId})
            userWallet.transaction.unshift(addToWallet)
            userWallet.balance+=100
            await userWallet.save()
            
            // delete userData.referralUserId;
            const userDataObject = userData.toObject();
            await User.updateOne({_id:userId}, { $unset: { referralUserId: "" } })
            
        }

        console.log("complted");
        await newOrder.save()
        userData.totalCart=0
        await userData.save()
        await UserCart.deleteMany({ userId: userId });
        console.log("deleted");
        const data=[true,"cashOnDelivery"]
        res.json(data)
      }
      else
      {
        console.log("failed");
        const data=[false,"failed"]
        res.json(data)
      }
      
      }

    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }
  
  // generate razorpay
  function generateRazorpay(amount, orderId) {
    return new Promise((resolve, reject) => {
      console.log("razorpay function awakened! GOOD MORNING!>>>>>>>>>");
      var instance = new Razorpay({
        key_id: process.env.KEY_ID,
        key_secret: process.env.KEY_SECRET,
      });
  
      var options = {
        amount: amount*100,
        currency: "INR",
        receipt: orderId
      };
      console.log("options", options);
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log("order is...", order);
          resolve(order);
        }
      });
    });
  }
  
  
  //Online payment route start
  const onlinePayment=async(req,res)=>{
    try {
        console.log("onlinr payment us started");
        console.log("cash on delivery tart");
        res.set("Cache-control","no-store");
        const paymentMethod=req.body.paymentMethod
        const deliveryCharge=Number(req.body.deliveryCharge)
        req.session.deliveryCharge=deliveryCharge
        console.log(paymentMethod);
        const userId=new ObjectId(req.session.user_id)
        const userData=await User.findById({_id:userId}).populate('deafultAddrss')
        const randomNumber = generateRandomNumber();
        const totalAmount=userData.totalCart+deliveryCharge
        console.log("total Amount",totalAmount);
        const orderId=`HOC${randomNumber}`
        const razorpayOrderId= await generateRazorpay(totalAmount,orderId)
        console.log("razorpay order id",razorpayOrderId);
        const currentDate = new Date();
        const shippingDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));
        console.log("shipping date",shippingDate);
        const deliveryDate = new Date(currentDate.getTime() + (5 * 24 * 60 * 60 * 1000));
        console.log("Current Date:", currentDate.toDateString());
        console.log("Dleievry date:", deliveryDate.toDateString());
        const userCart=await UserCart.find({userId:userId}).populate('productId')
        const productIds = userCart.map(cartItem => cartItem.productId._id);
        const productQty = userCart.map(cartQty => cartQty.quantity);
        const productPrices=userCart.map(cartPrice=>cartPrice.price)
        const productStatus=userCart.map(cartStatus=>cartStatus.status)
        const orderedItem = await userCart.map(item => ({
          productId: item.productId._id,
          quantity: item.quantity,
          totalProductAmount: item.totalPrice,
          offerId: item.offerId,
          productAmount: item.price,
          productStatus:"Pending"
      }))


        const newOrderItem=new OrderItems({
          productName:userCart.map(cartItem => cartItem.productId.productName),
          productPrice:userCart.map(cartItem => cartItem.productId.productPrice),
          productQuantity:userCart.map(cartItem => cartItem.productId.productQuantity),
          productDescription:userCart.map(cartItem => cartItem.productId.productDescription),
        })


        let totalPrice = productPrices.reduce((acc, curr) => acc + curr, 0);
        console.log("totalPrice",totalPrice);

        let couponValue=0;
        if(req.session.couponValue)
        {
          couponValue=req.session.couponValue
        }
        console.log("step 1");
        let amount=userData.totalCart+deliveryCharge
        console.log("step 2");

        const deliveryAddress={
          name:userData.deafultAddrss.name,
          mobile:userData.deafultAddrss.mobile,
          pincode:userData.deafultAddrss.pincode,
          locality:userData.deafultAddrss.locality,
          address:userData.deafultAddrss.address,
          city:userData.deafultAddrss.city,
          state:userData.deafultAddrss.state,
          landmark:userData.deafultAddrss.landmark,
          alterMobile:userData.deafultAddrss.alterMobile,
          addressType:userData.deafultAddrss.addressType
        }
        if(newOrderItem)
        {
          const newOrderItemID=await newOrderItem.save()
          console.log("step 3");
        const newOrder=new Order({
          orderId:orderId,
          userId:userData._id,
          payment:paymentMethod,
          deliveryAddress:deliveryAddress,
          orderDate:currentDate.toDateString(),
          productItem:productIds,
          cartProducts:newOrderItemID,
          productPrice:productPrices,
          productQuantity:productQty,
          totalPrice:totalPrice,
          amount:amount,
          orderStatus:"Payment Pending",
          shippingDate:shippingDate,
          deliveryDate:deliveryDate,
          productStatus:productStatus,
          coupon:couponValue,
          orderedItem:orderedItem,
          deliveryCharge:deliveryCharge
        })
        console.log("step 4");
        await newOrder.save()
        await UserCart.deleteMany({ userId: userId });
        console.log("step 5");
        userData.totalCart=0
        await userData.save()
      }

      console.log("step 6");

        if(razorpayOrderId)
        {
          console.log("success step 1");
          const data=[true,"onlinePayment",razorpayOrderId,deliveryCharge]
          res.json(data)
        }
        else
        {
          console.log("error step 2");
          res.status(500).json({message:"something wrong"})
        }
      
    } catch (error) {
      console.log(error);
      res.status(500).json({message:"internal server error"})
      res.render('errorPage')
    }
  }
  
  
  //verify Payment
  const verifyPayment=async(req,res)=>{
    try {
      res.set("Cache-control","no-store")
      console.log("payment verificaation started.....>>>>>");
      const payment=req.body.payment
      const order=req.body.order
      console.log("payment is ,",payment);
      console.log("order is ",order);
  
      let hmac= await computeHmac()
      await hmac.update(payment.razorpay_order_id+"|"+payment.razorpay_payment_id)
      const generatedHmac=await hmac.digest('hex')
      console.log("hmac",generatedHmac);
      console.log("signature",payment.razorpay_signature);
      console.log(generatedHmac==payment.razorpay_signature);
      if (generatedHmac === payment.razorpay_signature) {
        console.log("Payment is successful");
        const paymentMethod="onlinePayment"
        console.log(paymentMethod);
        const userId=new ObjectId(req.session.user_id)
        const userCart=await UserCart.find({userId:userId}).populate('productId')
        const userData=await User.findById({_id:userId})
        
        const currentDate = new Date();
       
   
        console.log("UserId",userId);
        console.log(userData._id);
        console.log(userData);
        console.log("Payment method",paymentMethod);
        console.log("Delivery Address",userData.deafultAddrss);
        console.log("order date",currentDate.toDateString());
        const productIds = userCart.map(cartItem => cartItem.productId._id);
        const productQty = userCart.map(cartQty => cartQty.quantity);
        const productPrices=userCart.map(cartPrice=>cartPrice.price)
        const productStatus=userCart.map(cartStatus=>cartStatus.status)
        // const cartProducts=[productIds,productQty,productPrices]

        const orderedItem = await userCart.map(item => ({
          productId: item.productId._id,
          quantity: item.quantity,
          totalProductAmount: item.totalPrice,
          offerId: item.offerId,
          productAmount: item.price,
          productStatus:"Pending"
      }))
  
        const paymentData=new Payment({
          paymentMethod:paymentMethod,
          paymentAmount:userData.totalCart,
          paymentId:payment.razorpay_payment_id,
          orderId:payment.razorpay_order_id,
          signature:payment.razorpay_signature,
          userId:userId,
          paymentTime:currentDate
        })
      
        await paymentData.save()
        const newOrderItem=new OrderItems({
          productName:userCart.map(cartItem => cartItem.productId.productName),
          productPrice:userCart.map(cartItem => cartItem.productId.productPrice),
          productQuantity:userCart.map(cartItem => cartItem.productId.productQuantity),
          productDescription:userCart.map(cartItem => cartItem.productId.productDescription),
        })
        if(newOrderItem)
        {
          const newOrderItemID=await newOrderItem.save()
          console.log("newOrderItemID is >>>>>>",newOrderItemID);
          console.log(productQty);
        console.log("product id",productIds);
        console.log("total amount",userData.totalCart);
        console.log("order status = ","not dispatched yet");
        const shippingDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));
        console.log("shipping date",shippingDate);
       
        const deliveryDate = new Date(currentDate.getTime() + (5 * 24 * 60 * 60 * 1000));
        console.log("Current Date:", currentDate.toDateString());
        console.log("Dleievry date:", deliveryDate.toDateString());
        req.session.orderId=order.receipt
        let couponValue=0;
        if(req.session.couponValue)
        {
          couponValue=req.session.couponValue
        }
        
        console.log("req.session.orderId",req.session.orderId);

        let totalPrice = productPrices.reduce((acc, curr) => acc + curr, 0);
        console.log("totalPrice",totalPrice);

        const deliveryCharge=req.session.deliveryCharge
        let amount=userData.totalCart+deliveryCharge
        delete req.session.deliveryCharge;

        const userNewOrder=await Order.findOne({userId:userId,orderId:order.receipt})
        userNewOrder.orderStatus="pending"
        await userNewOrder.save()
        console.log("userNewOrder saved successfully >>>>");

       
        req.session.orderConfirmed=true
        req.session.checkout=false
        if(userNewOrder)
        {
          if(userData.referralUserId)
        {
          const referId=userData.referralUserId
          const referUserData=await User.findById({_id:referId})

            const userReferals={
              userName:userData.name,
              amount:100,
              date:new Date(),
            }
            referUserData.referrals.unshift(userReferals)
             await referUserData.save()
            const addToWallet={
              amount:100,
              type:"credit",
              date:new Date()
            }
            const referalUserWallet=await Wallet.findOne({userId:referId})
            referalUserWallet.transaction.unshift(addToWallet)
            referalUserWallet.balance+=100
            await referalUserWallet.save()

            const userWallet=await Wallet.findOne({userId:userId})
            userWallet.transaction.unshift(addToWallet)
            userWallet.balance+=100
            await userWallet.save()
            
            await User.updateOne({_id:userId}, { $unset: { referralUserId: "" } })
            
        }

          const data=[true,"onlinePayment"]
          res.json(data)
        }
        else
        {
          console.log("failed");
          const data=[false,"failed"]
          res.json(data)
        }
        
        }
    } else {
        console.log("Payment verification failed");
    }
    
      } catch (error) {
        console.log(error);
        res.render('errorPage')
      }
  }
  
  
  //walletPayment
  const walletPayment=async(req,res)=>{
    try {
      console.log("walletPayment started >>>>>>");
  
  
      res.set("Cache-control","no-store")
      const paymentMethod=req.body.paymentMethod
      console.log(paymentMethod);
     
      const deliveryCharge=req.body.deliveryCharge
      const userId=new ObjectId(req.session.user_id)
      const userCart=await UserCart.find({userId:userId}).populate('productId')
      const userData=await User.findById({_id:userId}).populate('deafultAddrss')
  
      const userWallet=await Wallet.findOne({userId:userId})
  
      console.log(userWallet.balance);
      console.log(userData.totalCart);
      if(userWallet.balance>=userData.totalCart)
      {
        userWallet.balance=userWallet.balance-userData.totalCart
        const newTransaction={
          amount:userData.totalCart,
          type:"debit",
          date:new Date()
        }
        userWallet.transaction.unshift(newTransaction)
        await userWallet.save()
        const randomNumber = generateRandomNumber();
        const currentDate = new Date();
        console.log(randomNumber); 
        const orderId=`HOC${randomNumber}`
        console.log("OrderId is =",orderId);
        console.log("UserId",userId);
        console.log(userData._id);
        console.log(userData);
        console.log("Payment method",paymentMethod);
        console.log("Delivery Address",userData.deafultAddrss);
        console.log("order date",currentDate.toDateString());
        const productIds = userCart.map(cartItem => cartItem.productId._id);
        const productQty = userCart.map(cartQty => cartQty.quantity);
        const productPrices=userCart.map(cartPrice=>cartPrice.price)
        const productStatus=userCart.map(cartStatus=>cartStatus.status)
        // const cartProducts=[productIds,productQty,productPrices]

        const orderedItem = await userCart.map(item => ({
          productId: item.productId._id,
          quantity: item.quantity,
          totalProductAmount: item.totalPrice,
          offerId: item.offerId,
          productAmount: item.price,
          productStatus:"Pending"
      }))
    
        console.log("Stats",productStatus);
        const paymentData=new Payment({
          paymentMethod:paymentMethod,
          paymentAmount:userData.totalCart,
          paymentId:0,
          orderId:0,
          signature:0,
          userId:userId,
          paymentTime:currentDate
        })
      
        await paymentData.save()
      
        const newOrderItem=new OrderItems({
          productName:userCart.map(cartItem => cartItem.productId.productName),
          productPrice:userCart.map(cartItem => cartItem.productId.productPrice),
          productQuantity:userCart.map(cartItem => cartItem.productId.productQuantity),
          productDescription:userCart.map(cartItem => cartItem.productId.productDescription),
        })
        if(newOrderItem)
        {
          const newOrderItemID=await newOrderItem.save()
          console.log("newOrderItemID is >>>>>>",newOrderItemID);
          console.log(productQty);
        console.log("product id",productIds);
        console.log("total amount",userData.totalCart);
        console.log("order status = ","not dispatched yet");
        const shippingDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));
        console.log("shipping date",shippingDate);
       
        const deliveryDate = new Date(currentDate.getTime() + (5 * 24 * 60 * 60 * 1000));
        console.log("Current Date:", currentDate.toDateString());
        console.log("Dleievry date:", deliveryDate.toDateString());
        req.session.orderId=orderId
        let coupnValue=0


        let totalPrice = productPrices.reduce((acc, curr) => acc + curr, 0);
        console.log("totalPrice",totalPrice);

        let amount=userData.totalCart+deliveryCharge
        if(req.session.couponValue)
        {
          coupnValue=req.session.couponValue
        }
        console.log("req.session.orderId",req.session.orderId);

      const deliveryAddress={
        name:userData.deafultAddrss.name,
        mobile:userData.deafultAddrss.mobile,
        pincode:userData.deafultAddrss.pincode,
        locality:userData.deafultAddrss.locality,
        address:userData.deafultAddrss.address,
        city:userData.deafultAddrss.city,
        state:userData.deafultAddrss.state,
        landmark:userData.deafultAddrss.landmark,
        alterMobile:userData.deafultAddrss.alterMobile,
        addressType:userData.deafultAddrss.addressType
      }
        const newOrder=new Order({
          orderId:orderId,
          userId:userData._id,
          payment:paymentMethod,
          deliveryAddress:deliveryAddress,
          orderDate:currentDate.toDateString(),
          productItem:productIds,
          cartProducts:newOrderItemID,
          productPrice:productPrices,
          productQuantity:productQty,
          totalPrice:totalPrice,
          amount:amount,
          orderStatus:"Ordered",
          shippingDate:shippingDate,
          deliveryDate:deliveryDate,
          productStatus:productStatus,
          coupon:coupnValue,
          orderedItem:orderedItem,
          deliveryCharge:deliveryCharge
        })
        req.session.orderConfirmed=true
        req.session.checkout=false
        if(newOrder)
        {
          if(userData.referralUserId)
          {
            const referId=userData.referralUserId
            const referUserData=await User.findById({_id:referId})
  
              const userReferals={
                userName:userData.name,
                amount:100,
                date:new Date(),
              }
              referUserData.referrals.unshift(userReferals)
               await referUserData.save()
              const addToWallet={
                amount:100,
                type:"credit",
                date:new Date()
              }
              const referalUserWallet=await Wallet.findOne({userId:referId})
              referalUserWallet.transaction.unshift(addToWallet)
              referalUserWallet.balance+=100
              await referalUserWallet.save()
  
              const userWallet=await Wallet.findOne({userId:userId})
              userWallet.transaction.unshift(addToWallet)
              userWallet.balance+=100
              await userWallet.save()
              
              await User.updateOne({_id:userId}, { $unset: { referralUserId: "" } })
              
          }
  
          console.log("complted");
          await newOrder.save()
          userData.totalCart=0
          await userData.save()
          await UserCart.deleteMany({ userId: userId });
          console.log("deleted");
          const data=[true,"walletPayment"]
          res.json(data)
        }
        else
        {
          console.log("failed");
          const data=[false,"failed"]
          res.json(data)
        }
        
        }
  
      }
      else
      {
  
          console.log("no enough balance");
          const data=[false,"walletPayment"]
          res.json(data)
  
      }

    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }


// repayment from orders
  const repayment=async(req,res)=>{
    try {
      const amount=req.body.amount
      console.log("amount is",amount);
      const userId=new ObjectId(req.session.user_id)
    
     
      const userData=await User.findById({_id:userId})
      const randomNumber = generateRandomNumber();
      const orderDetails=await Order.findOne({userId:userId,orderStatus:"Payment Pending",amount:amount})
      console.log("step 1");
      console.log("order details",orderDetails);
      const orderID=orderDetails.orderId
      console.log("orderId",orderID);
      const razorpayOrderId= await generateRazorpay(amount,orderID)
      console.log("razorpay order id",razorpayOrderId);
      if(razorpayOrderId)
      {
        console.log("success step 1");
        const data=razorpayOrderId
        res.json(data)
      }
      else
      {
        console.log("error step 2");
        res.status(500).json({message:"something wrong"})
      }
    
      
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }
  
  
  module.exports={
    cashOnDelivery,
    onlinePayment,
    verifyPayment,
    walletPayment,
    repayment,
  }
