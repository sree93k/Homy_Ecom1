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


async function computeHmac()
{

const hmac=crypto.createHmac('sha256',process.env.KEY_SECRET)
return hmac
}


function generateRandomNumber() {
    
    return Math.floor(Math.random() * 900000) + 100000;
  }


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
  
  
const userWallet=async(req,res)=>{
    try {
      console.log("user user wallet start");
      const userId=new ObjectId(req.session.user_id)
      const isLogin=req.session.loginStatus
      const UserData=await User.findById({_id:userId})
      console.log(userId)
      console.log(isLogin);
      const userWallet=await Wallet.findOne({userId:userId})
      console.log("user wallet",userWallet);
      res.render('userWallet',{isLogin:isLogin,userId:UserData,userWallet:userWallet})
      
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }
  
  const addWallet=async(req,res)=>{
    console.log("add wallet started....");
    const amount=req.body.amount
    console.log("amount is",amount);
    const userId=new ObjectId(req.session.user_id)
  
   
    const userData=await User.findById({_id:userId})
    const randomNumber = generateRandomNumber();
    
    const orderId=`HOW${randomNumber}`
    const razorpayOrderId= await generateRazorpay(amount,orderId)
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
      res.render('errorPage')
    }
  }
  
  //verify addWallet
  const verifyAddWallet=async(req,res)=>{
    try {
      console.log("verify Add Wallet starting>>");
      const amount=req.body.payment
      const order=req.body.order
      const addedAmount=order.amount/100;
      console.log("addedAmount is ",addedAmount);
      console.log(amount);
      console.log(order);
      console.log("step 1");
      let hmac= await computeHmac()
      console.log("step 2");
      await hmac.update(amount.razorpay_order_id+"|"+amount.razorpay_payment_id)
      console.log("step 3");
      const generatedHmac=await hmac.digest('hex')
      console.log("step 4");
      console.log("hmac",generatedHmac);
      console.log("signature",amount.razorpay_signature);
      console.log(generatedHmac==amount.razorpay_signature);
      console.log("step 5");
      if (generatedHmac === amount.razorpay_signature) {
        const userId=new ObjectId(req.session.user_id)
        const userData=await User.findById({_id:userId})
        console.log("step 6");
         const userWallet=await Wallet.findOne({userId:userId})
        console.log(userWallet);
        console.log("step 7");
        let balance=userWallet.balance
        console.log("step 8");
        balance=balance+addedAmount
        console.log("step 9");
        userWallet.balance=balance
        console.log("step 10");
        const transaction={
          amount:addedAmount,
          type:"credit",
          date:new Date()
            }
            console.log("step 11");
        userWallet.transaction.unshift(transaction)
        console.log(userWallet);
        console.log("step 12");
        await userWallet.save()
        console.log("step 13");
            res.json(true)
            console.log("step 14");
      }
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }

  module.exports={
    userWallet,
    addWallet,
    verifyAddWallet,
  }
