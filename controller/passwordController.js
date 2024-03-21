


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

//password encrypting
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error);
    res.render('errorPage')
  }
};


const resetPassword=async(req,res)=>{
    try {
      console.log("user resetPassword start");
      const userId=new ObjectId(req.session.user_id)
      const isLogin=req.session.loginStatus
      const UserData=await User.findById({_id:userId})
      console.log(userId)
      console.log(isLogin);
      res.render('resetPassword',{isLogin:isLogin,userId:UserData})
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }
  
 
  
  const currentPassword=async(req,res)=>{
    try {
      console.log("currentPassword started");
      const userId=req.query.id
      console.log("step 1");
      const receivedPassword=req.body.currentPassword
  
      const userData=await User.findById({_id:userId})
      
      await OTP.deleteMany({ userEmail: userData.email });
   
      const currentPassword=await bcrypt.compare(receivedPassword,userData.password)
      console.log(currentPassword);
      console.log("step 6");
      const email=req.session.email
      if(currentPassword)
      {
        const otp = otpGenerator.generate(4, {digits:true, upperCaseAlphabets: false, specialChars: false , lowerCaseAlphabets:false});
  
        const otpDB=new OTP({
          userId:userId,
          userEmail:userData.email,
          otp:otp
        })
        console.log(otpDB)
        console.log("error occuered 1");
        await otpDB.save()
      const userEmail=userData.email
            //nodemailer
      console.log("nodemailer");
      const mailOptions={
        from:"sreekuttan1248@gmail.com",
        to:userEmail,
        subject:"OTP Verification - Homy ",
        text:`Your OTP for verification is :${otp}`
      } 
      transporter.sendMail(mailOptions,(error,info)=>{
        if(error){
          console.log("failed to send",error)
          return res.status(500).json({error:"Failed to send OTP"})
        }
        else{
         
         console.log("User Details"+userId)
          console.log('email sent '+ info.response)
          const data=[true,"Mailss Sent Successfully",userId]
      
          res.json(data)
        }
      })
  
      }
      else
      {
          console.log("error to save password>>>>>");
          const data=[false,"Password Not Correct"]
          res.json(data)
      }
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }
  
  
  const resetPasswordOtpVerification=async(req,res)=>{
    try {
      console.log("otp checking starting >>>>>>>>>");
      const receivedOtp=Number(req.query.id)
      const userId=req.body.userId
      console.log("first ", receivedOtp,"= and =",userId);
      console.log("otp userip",userId);
      const UserId=new ObjectId(userId)
      console.log(UserId);
      console.log("news");
      const userData=await User.findOne({_id:userId})
      const otpData=await OTP.findOne({userEmail:userData.email})
      console.log(otpData);
      console.log(UserId);
      console.log(otpData.userId);
      console.log("checking");
      console.log(otpData.otp);
      console.log(receivedOtp);
      if(otpData.otp===receivedOtp)
      {
        console.log('otp matching')
          const data=[true,"otp match Successfully",UserId]
          res.json(data)
      }
      else
      {
        console.log("otp not matching");
        const data=[false,"Incorrect OTP"]
        res.json(data)
      }
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }
  
  
  const resetNewPassword=async(req,res)=>{
    try {
      console.log("resetNewPassword start");
      console.log(req.body.newPassword);
      console.log(req.query.id);
      const newPassword=req.body.newPassword
      const userId=new ObjectId(req.query.id)
      console.log(userId)
      console.log("new password setup 1 >>>>");
      const passwordRegex=/^[a-zA-Z0-9!@#$%^&*]+\S{8}$/
      
      const Users=await User.findOne({_id:userId})
      console.log("new password 2 started >>>>");
      if(passwordRegex.test(newPassword))
      {
        if(newPassword.includes(" "))
        {
          console.log("password free space");
          const data=[false,"free space"]
          res.json(false)
        }
        else
        {
          console.log(Users)
          const spassword = await securePassword(newPassword);
          Users.password=spassword
          await Users.save()
          const data=[true,"Successfully Changed"]
          res.json(data)
        }
      }
      else
      {
          console.log("password invalid format");
          const data=[false,"invalid format"]
          res.json(false)
      }
  
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }


const forgotPassword=async(req,res)=>{
  try {
   console.log("forgot password");
   const requestPasswordEmail=req.body.ForgotPasswordEmail
   console.log(requestPasswordEmail);
   const user=await User.findOne({email:requestPasswordEmail})
   console.log(user);
   if(user)
   {
    console.log('Account Exist !')
    //otp generator
    const otp = otpGenerator.generate(4, {digits:true, upperCaseAlphabets: false, specialChars: false , lowerCaseAlphabets:false});
    console.log("error 1");
    let userData=null
    console.log("error 2");
    req.session ? console.log('session exits'):console.log("session error");
    req.session.userData=user
    console.log(req.session.userData);

    console.log("user level Data"+req.session.userData._id);
    //otp save to db
    console.log("otp is"+otp)
    const otpDB=new OTP({
      userId:req.session.userData._id,
      userEmail:req.session.userData.email,
      otp:otp
    })
    console.log(otpDB)
    console.log("error occuered 1");
    console.log("one");
    await otpDB.save()
    console.log("one");
    console.log("error occuered 2");
    //nodemailer
    console.log("nodemailer");
    const mailOptions={
      from:"sreekuttan1248@gmail.com",
      to:requestPasswordEmail,
      subject:"OTP Verification - Homy ",
      text:`Your OTP for verification is :${otp}`
    } 
    console.log("mail sending");
    console.log(mailOptions)

    //mail sending
    transporter.sendMail(mailOptions,(error,info)=>{
      if(error){
        console.log("failed to send",error)
        return res.status(500).json({error:"Failed to send OTP"})
      }
      else{
       
       console.log("User Details"+user._id)
        console.log('email sent '+ info.response)
        const data=[true,"Mail Sent Successfully",user._id]
        // return res.status(200).json({userId:user._id,info:"Mail Sent Successfully"})
        res.json(data)
      }
    })
    console.log("forgot password otp page is loaded succesfully");

    // const data=[true,'Account Exist !',]
    // res.json(data)
   }
   else
   {
    console.log('No Account Exist !')
    const data=[false,'No Account Exist !']
    res.json(data)
   }
  } catch (error) {
    console.log("error got 1")
    console.log(error)
    res.render('errorPage')
  }
}



//forgot Password Otp Verification
const forgotPasswordOtpVerification=async(req,res)=>{
  try {
    console.log("forgot password otp verification started")
    const userId=req.body.userId
    const receivedOtp=req.query.id
    console.log(userId)
    console.log(typeof(receivedOtp))
    const OtpVerify=await OTP.findOne({otp:receivedOtp})
    console.log(OTP.otp)
    // const OtpVerify=false
    console.log("otp"+OtpVerify)
    if(OtpVerify)
    {
      console.log("forgotPasswordOtpVerification success")
      const data=[true,"OTP success",userId]
      res.json(data)
    }
    else
    {
      console.log("forgotPasswordOtpVerification failed")
      const data=[false,"OTP failed"]
      res.json(data)
    }
    
  } catch (error) {
    console.log(error);
    res.json(error)
    res.render('errorPage')
  }
}

//forgot Password New Email
const forgotPasswordNewEmail=async(req,res)=>{
  try {
    console.log("new password setup started >>>>");
    console.log(req.body.newPassword);
    console.log(req.query.id);
    const newPassword=req.body.newPassword
    const userId=new ObjectId(req.query.id)
    console.log(userId)
    console.log("new password setup 1 >>>>");
    const passwordRegex=/^[a-zA-Z0-9!@#$%^&*]+\S{8}$/
    
    const Users=await User.findOne({_id:userId})
    console.log("new password 2 started >>>>");
    if(passwordRegex.test(newPassword))
    {
      if(newPassword.includes(" "))
      {
        console.log("password free space");
        const data=[false,"free space"]
        res.json(false)
      }
      else
      {
        console.log(Users)
        const spassword = await securePassword(newPassword);
        Users.password=spassword
        await Users.save()
        const data=[true,"Successfully Changed"]
        res.json(data)
      }
    }
    else
    {
        console.log("password invalid format");
        const data=[false,"invalid format"]
        res.json(false)
    }

  } catch (error) {
    console.log(error)
    res.render('errorPage')
  }
}


  module.exports={
    securePassword,
    resetPassword,
    currentPassword,
    resetPasswordOtpVerification,
    resetNewPassword,
    forgotPassword,
    forgotPasswordOtpVerification,
    forgotPasswordNewEmail,
  }