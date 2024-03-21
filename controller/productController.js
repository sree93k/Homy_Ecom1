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



//product login
const eachProductLogin=async(req,res)=>{
    try {
      res.set("Cache-control","no-store")
        console.log("helkoo")
        // res.render('singleProduct')
        const loginStatus=req.session.login_status=true
        const productId=req.query.product
        console.log("req query",req.query);
        const product=await Product.findOne({_id:productId})
        console.log("productId >>>,",productId)
        const userId=new ObjectId(req.session.user_id)
       
        const UserData=await User.findById({_id:userId})
        console.log(UserData)
        
        
      if(product)
      {
        console.log(loginStatus)
        res.render('singleProduct',{products:product,loginStatus:loginStatus,userId:UserData})
      }
    
    } catch (error) {
      console.log(error)
      res.render('errorPage')
    }
  }
  
  //product login
  const eachProductLogout=async(req,res)=>{
    try {
      res.set("Cache-control","no-store")
        console.log("helkoo")
        // res.render('singleProduct')
        const loginStatus=req.session.login_status=false
        const productId=req.query.product
        const product=await Product.findOne({_id:productId})
        console.log(productId)
        
      if(product)
      {
        console.log(loginStatus)
        res.render('singleProduct',{products:product,loginStatus:loginStatus})
      }
    
    } catch (error) {
      console.log(error)
      res.render('errorPage')
    }
  }

  module.exports={
    eachProductLogin,
    eachProductLogout,
  }