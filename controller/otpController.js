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

//node mailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

//Verify OTP
const verifyOtp=async(req,res)=>{
    try {
     
      console.log("verification started>>>>>>>>YES")
      const otpUserId=req.body.otpUserId
      const currentOtp=req.query.id
      console.log(currentOtp);
      console.log(typeof(currentOtp));
      const actualOtp=await OTP.findOne({otp:currentOtp})
      console.log("ACTUAL OTP is",actualOtp);
      const email=req.session.userEmail
      console.log("email is",email);
      delete req.session.userEmail
      console.log("req.session.userEmail",req.session.userEmail);
      const actualUser=await OTP.findOne({userEmail:email})
      console.log(actualUser)
      console.log(actualUser.userEmail)
      // const actualUserId=actualUser.email
      console.log("ACTUALUSER ID",);
      if(actualOtp)
      {
        const OtpUserId=actualOtp.email
        const newUser=new User(req.session.userData)
        const userData = await newUser.save();
        console.log("new user is ",newUser);
  
        console.log("user datat is ",userData);
        const UserID=await User.findOne({email:email})
        console.log("otp verification start");
        console.log(currentOtp)
        console.log(actualOtp);
        console.log(actualOtp.email)
        console.log(typeof(actualOtp.otp))
        console.log(OtpUserId);
        console.log(UserID)
        console.log("otp end");
        console.log(actualOtp.userId)
        console.log("end last")
        if(UserID)
        {
          console.log("before"+UserID)
          UserID.isVerified=true
          await UserID.save()
          console.log("after"+UserID)
          console.log("now Otp verified Successfully")
          
          const newUserWishList=new Wishlist({
            userId:UserID._id,
     
          })
          await newUserWishList.save()
  
          let userReferals;
          console.log("user referrals >>>>> just started >>>>>");
          if(req.session.refferalUserId)
           {
            const userID=new ObjectId(req.session.refferalUserId)
            userData.referralUserId=userID
         
             userData.save()
             delete req.session.refferalUserId;
           
             console.log("finish >>>>>");
           }
           
  
          const newUserWallet=new Wallet({
            userId:userData._id,
            balance:0
          })
          await newUserWallet.save()
          
       
          res.json(true)
        }
        else
        {
          console.log("otp error occured 1")
         await User.findByIdAndDelete({_id:otpUserId})
   
          console.log("Incorrect OTP");
          // res.redirect('/home')
          res.json(false)
    
        }
      }
      else
      {
        await User.findByIdAndDelete({_id:otpUserId})
        console.log("otp error occured 2")
       
        console.log("Incorrect OTP");
          // res.redirect('/home')
          res.json(false)
      }
      
    } catch (error) {
      console.log(error)

      res.render('errorPage')
      
    }
  }
  
  // otp creating 
const secret=speakeasy.generateSecret({length:20})
  //resendOTP
  const resendOTP=async(req,res)=>{
    try {
      console.log("resendOTP >>>>>>");
  
      console.log(req.session.userData)
      console.log("step 5")
      console.log("step 6")
      
        const otp=speakeasy.totp({
          secret:secret.base32,
          encoding:"base32"
        })
        const email=req.session.userEmail
        console.log("user email sesion",email );
        const otpExists=await OTP.findOne({userEmail:email})
        console.log("otpExists ..",otpExists);
        if(otpExists)
        {
          console.log("inner old otp");
         const oldOTP=await OTP.findOne({userEmail:email})
         const oldOTPId=oldOTP._id
         console.log("oldOTPId",oldOTPId);
         await OTP.findByIdAndDelete({_id:oldOTPId})
        }
  
        const otpDB=new OTP({
          userEmail:email,
          otp:otp
        })
  
        req.session.userEmail=email
        console.log(otpDB)
        await otpDB.save()
        
  
        const mailOptions={
          from:"sreekuttan1248@gmail.com",
          to:email,
          subject:"OTP Verification - Homy ",
          text:`Your OTP for verification is :${otp}`
        } 
        console.log("mailOptions,",mailOptions)
       
        transporter.sendMail(mailOptions,(error,info)=>{
          if(error){
            console.log("failed to send",error)
            return res.status(500).json({error:"Failed to send OTP"})
          }
          else{
           
          
            console.log('email sent '+ info.response)
            const data=["Mail Sent Successfully"]
          
            res.json(data)
          }
        })
        console.log("resend otp page is loaded succesfully");
      
  
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }
  
  module.exports={
    verifyOtp,
    resendOTP
  }