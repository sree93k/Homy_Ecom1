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
const easyinvoice = require('easyinvoice');
const { error, log } = require("console");

//order confirmed
const orderConfirmed=async(req,res)=>{
    try {
      console.log("orderConfirmed started");
      res.set("Cache-control","no-store")
      const userId=new ObjectId(req.session.user_id)
      const isLogin=req.session.loginStatus
      const UserData=await User.findById({_id:userId})
      console.log(UserData)
      console.log(isLogin);
      const orderId=req.session.orderId
      console.log(orderId);
      const orderDetails=await Order.findOne({orderId:orderId}).populate({ path: 'deliveryAddress', options: { strictPopulate: false } })
      console.log(orderDetails);

      const totalPrice=orderDetails.productPrice.reduce((acc, curr) => acc + curr, 0);
      console.log("totalOrice",totalPrice);
      console.log("oderAdress",orderDetails.deliveryAddress);
      const productDetails = await Promise.all(orderDetails.productItem.map(async (productId) => {
        const product = await Product.findById(productId);
        return product;
      }));
      console.log("product details>>>>",productDetails);
      res.render('orderConfirm',{isLogin:isLogin,userId:UserData,orderId:orderDetails.deliveryAddress,orderDetails:orderDetails,productDetails:productDetails})
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }
  
  //user order
  const userOrders=async(req,res)=>{
    try {
      console.log("user order start");
      const userId=new ObjectId(req.session.user_id)
      const isLogin=req.session.loginStatus
      const UserData=await User.findById({_id:userId})
      console.log(userId)
      console.log(isLogin);
      const userOrder=await Order.find({userId:userId}).sort({createdAt:-1}).populate('deliveryAddress').populate('productItem').populate('cartProducts')
      console.log("order.......");
      
      console.log(userOrder);
   
     
      // console.log("user product",userOrder[2].productItem);
      res.render('userOrder',{isLogin:isLogin,userId:UserData,orderDetails:userOrder})
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }
  
  
  //cancel order
  const cancelOrder=async(req,res)=>{
    try {
      console.log("cancel order start");
      console.log(req.query.orderId);
      const orderId=new ObjectId(req.query.orderId)
      console.log(orderId);
      const orderDetails=await Order.findById(orderId)
      console.log(orderDetails);
      if (!orderDetails) {
        console.log("Order not found");
        return res.status(404).send("Order not found");
      }
  
      const statusArrayLen=orderDetails.orderStatus.length
      console.log(statusArrayLen);
  
      orderDetails.orderStatus.unshift('Cancelled')
      await orderDetails.save()
      console.log("final...",orderDetails);
      // res.redirect('/home/userOrders')
      res.json(orderDetails)
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }

  //cancel Order Item
const cancelOrderItem=async(req,res)=>{
    try {
      console.log("starting cancelOrderItem >>>>>>");
      const orderId=new ObjectId(req.query.orderId)
      const productId=new ObjectId(req.query.productId)
      console.log("orderId",orderId);
      console.log("productId",productId);
      const orderData=await Order.findById({_id:orderId}).populate('productItem')
      console.log("orderData is ", orderData);
      console.log(orderData.productItem.length);
      console.log("loop goinf to started...");
      for(let i=0;i<orderData.productItem.length;i++)
      {
        console.log("loop started....");
        console.log(orderData.productItem[i]._id);
        console.log(productId);
        if(orderData.productItem[i]._id.equals(productId))
        {
          console.log("matching");
          console.log(orderData.productStatus[i]);
          if(orderData.payment==="cashOnDelivery")
          {
          console.log("cashon delivery>>");            
            orderData.productStatus[i]="Cancelled"
            orderData.amount= orderData.amount- orderData.productPrice[i]
            const allCancelled = orderData.productStatus.every(status => status === "Cancelled");
            console.log("allcancelled statuys",allCancelled);
            if (allCancelled) {
              console.log("All products are cancelled.");
              orderData.orderStatus="Cancelled"
            } else {
                console.log("Some products are not cancelled.");
            }
          }
          else if(orderData.orderStatus==="Payment Pending" )
          {

            console.log("peyment pending >>");   
            orderData.productStatus[i]="Cancelled"
            orderData.amount= orderData.amount- orderData.productPrice[i]
            const allCancelled = orderData.productStatus.every(status => status === "Cancelled");
            console.log("allcancelled statuys",allCancelled);
            if (allCancelled) {
              console.log("All products are cancelled.");
              orderData.orderStatus="Cancelled"
            } else {
                console.log("Some products are not cancelled.");
            }
          }
          else 
          {
            console.log("else plyment >>");   
            orderData.productStatus[i]="Cancel Refund Initiated"
            orderData.amount= orderData.amount- orderData.productPrice[i]
          }

          

          await orderData.save()
          console.log("final setup is",orderData);
          res.json(orderData)
        }
      }
    } catch (error) {
      
      console.log(error);
      res.render('errorPage')
    }
  }

const downloadInvoice=async(req,res)=>{
  try {
    console.log("downlaod invoice started >>");
    const orderId=new ObjectId(req.query.orderId)
    console.log("order ID is ",orderId);
    const orderData=await Order.findById({_id:orderId}).populate('deliveryAddress').populate('productItem')
    console.log("order data",orderData);
    const userId=new ObjectId(req.session.user_id)

    console.log("user Id",userId);
    const userData=await User.findById({_id:userId})
    const loginStatus=req.session.loginStatus
    res.render('invoice',{orderDetails:orderData,loginStatus:loginStatus,userId:userData})
} catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
    res.render('errorPage')
}
}

const userRating=async(req,res)=>{
  try {
    console.log("userRating started >>>>");
    const userId=req.body.userId
    const productId=req.body.productId
    const orderId=req.body.orderId
    const rating=req.body.rating
    const review=req.body.review
    console.log("Revoiw LOG",req.body.review);
    console.log("user",userId);
    console.log("product",productId);
    console.log("orderId",orderId);
    console.log("rating",rating);
    console.log("review",review);
    const productsDetails=await Product.findById({_id:productId})
    const userData=await User.findById({_id:userId})
  
    await productsDetails.productRating.rating.unshift(rating)
    await productsDetails.productRating.userName.unshift(userData.name)
    await productsDetails.productRating.review.unshift(review)
    
    await productsDetails.save()
    console.log("product Details",productsDetails.productRating);

   const orderData=await Order.findById({_id:orderId})
   for(let i=0;i<orderData.productItem.length;i++)
   {
     console.log("loop started....");
     console.log(orderData.productItem[i]._id);
     console.log(productId);
     if(orderData.productItem[i]._id.equals(productId))
     {
       console.log("matching");
       console.log(orderData.productStatus[i]);
       if(orderData.payment==="cashOnDelivery")
       {
         orderData.productStatus[i]="Delivered-Success"
       }
      
       
       await orderData.save()
       console.log("final setup is",orderData);
       res.json(orderData)
     }
   }

   
  } catch (error) {
    console.log(error);
    res.render('errorPage')
  }
}

//returnProduct
const returnProduct=async(req,res)=>{
  try {
    console.log("returnProduct started");
    const orderId=new ObjectId(req.body.orderId)
    const productId=new ObjectId(req.body.productId)
    const returnReason=req.body.reason
    console.log(orderId);
    console.log(productId);
    console.log(returnReason);
    const userId=new ObjectId(req.session.user_id)
    const newReturn=new Return({
      userId:userId,
      productId:productId,
      orderId:orderId,
      returnReason:returnReason,
      returnDate:new Date(),
      returnStatus:"Return Pending-Please Wait for Confirmation"
    })
    
    await newReturn.save()
    const orderData=await Order.findById({_id:orderId}).populate('productItem')

    for(let i=0;i<orderData.productItem.length;i++)
    {
      console.log("loop started....");
      console.log(orderData.productItem[i]._id);
      console.log(productId);
      if(orderData.productItem[i]._id.equals(productId))
      {
        console.log("matching");
        console.log(orderData.productStatus[i]);
        orderData.productStatus[i]="Return Initiated"
   
        await orderData.save()
        console.log("final setup is",orderData);
        const data=true
        res.json(data)

      }

    } 
  } catch (error) {
    console.log(error);
    res.render('errorPage')
  }
}

const buyAgain=async(req,res)=>{
  try {
    console.log("buy again startedd");
    const productId=req.query.id
    console.log("product Id is",productId);

    
  } catch (error) {
    console.log(error);
    res.render('errorPage')
  }
}

  module.exports={
    orderConfirmed,
    userOrders,
    cancelOrder,
    cancelOrderItem,
    downloadInvoice,
    userRating,
    returnProduct,
    buyAgain
  }