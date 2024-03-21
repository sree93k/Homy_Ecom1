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


//applyCoupon
const applyCoupon=async(req,res)=>{
    try {
      console.log("applyCoupon started");
      const couponData=await Coupon.find({})
      console.log(couponData);
      res.json(couponData)
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }
  
  //addOnCoupon
  const addOnCoupon=async(req,res)=>{
    try {
      console.log("add on addOnCoupon started");
      const couponId=new ObjectId(req.body.couponId)
      console.log("couponId is ...",couponId);
      const applycouponData=await Coupon.findById({_id:couponId})
      console.log("applycouponData is ",applycouponData);
  
      const userId=req.session.user_id
      const isLogin=req.session.loginStatus
      const UserData=await User.findById({_id:userId})
      // console.log(UserData);
      console.log("step 1");
      const userCart=await UserCart.findOne({userId:userId}).populate('productId')
      let totalValue=UserData.totalCart
      console.log("totalValue,>>>>>>",totalValue);
      let couponValue=applycouponData.discountValue
      console.log('step 1.1');
      // console.log(applycouponData);
      // console.log(applycouponData.discountValue);
      console.log("couponValue,>>>>",couponValue);
      req.session.couponValue=couponValue
      if(applycouponData.discountType==="discountValue")
      {
        console.log("step a");
        totalValue=totalValue-couponValue
      }
      else if(applycouponData.discountType==="discountPercentage")
      {
        console.log("step b");
        couponValue=((totalValue*couponValue)/100)
        totalValue=totalValue-couponValue
      }
      // console.log(userCart);
      // console.log(userCart.couponValue);
      // console.log(couponValue);
      // console.log(typeof(userCart.couponValue));
      // console.log(typeof(couponValue));
      console.log("couponValue,>>>>2nd",couponValue);
      userCart.couponValue=couponValue
      await userCart.save()
      console.log("totalValue  is..",totalValue);
      UserData.totalCart=totalValue
      await UserData.save()
       
  
      const defaultAddressId=new ObjectId(UserData.deafultAddrss)
      
      const defaultAddress=await Address.findById({_id:defaultAddressId})
      // console.log(defaultAddress);
      console.log("step 2");
      const allAddress=await Address.find({userId:userId})
      // console.log(allAddress);
      // console.log(userId)
      // console.log(isLogin);
      const couponData=await Coupon.find({})
      // console.log("couponData is ...",couponData);
      req.session.checkout=true
      req.session.couponId=applycouponData._id
      req.session.couponValue=couponValue
      console.log("user data is ",UserData);
      console.log("coupn value is ",couponValue);
      const data=true
      console.log("coupon end @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
      res.json(data)
      
  
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }
  
  
  //removeCoupon
  const removeCoupon=async(req,res)=>{
    try {
      console.log("removeCoupon is>>>");
      const couponId=new ObjectId(req.session.couponId) 
      const userId=new ObjectId(req.session.user_id)
      console.log(couponId);
        req.session.couponId=0
        req.session.couponValue=0
      const userData=await User.findById({_id:userId})
      const userCart=await UserCart.findOne({userId:userId}).populate('productId')
      const couponValue=userCart.couponValue
      console.log(userData.totalCart);
      console.log(userCart);
      console.log();
      console.log("step 2");
      let total=userData.totalCart
  
      console.log("step 3");
      console.log(total);
      console.log(couponValue);
      total=total+couponValue
      console.log("step 4");
      console.log(total);
      console.log(userData.totalCart);
      userData.totalCart=total
      userCart.couponValue=0
      console.log("step 5");
      await userData.save()
      console.log("step 6");
      await userCart.save()
      console.log("step 7");
      const data=true
      res.json(data)
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }


  module.exports={
    applyCoupon,
    addOnCoupon,
    removeCoupon,
  }