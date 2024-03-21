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


const userAddress=async(req,res)=>{
    try {
      console.log("user address start");
      const userId=new ObjectId(req.session.user_id)
      const isLogin=req.session.loginStatus
      const UserData=await User.findById({_id:userId})
      console.log(userId)
      console.log(isLogin);
      const userAddress=await Address.find({userId:userId},{isDeleted:false})
      console.log("loading user all address");
      console.log(userAddress);
      const userAddressCount=await Address.countDocuments({userId:userId})
      console.log(userAddressCount);
      res.render('userAddress',{isLogin:isLogin,userId:UserData,address:userAddress})
      
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }
  
  
  //load add address
  const loadAddAddress=async(req,res)=>{
    try {
      console.log("load add address");
      const userId=new ObjectId(req.session.user_id)
      const isLogin=req.session.loginStatus
      const UserData=await User.findById({_id:userId})
      console.log(userId)
      console.log(isLogin);
      console.log("hiii");
      res.render('addAddress',{isLogin:isLogin,userId:UserData})
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }
  
  //load add address
  const uploadAddAddress=async(req,res)=>{
    try {
      console.log("load add address");
      console.log(req.body.userName);
      console.log(req.body.userMobile);
      const Name=req.body.userName
      const Mobile=req.body.userMobile
      const Pincode=req.body.userPincode
      const Locality=req.body.userLocality
      const address=req.body.userAddress
      const City=req.body.userCity
      const State=req.body.userState
      const Landmark=req.body.userLandmark
      const AltMobile=req.body.userAltMobile
      const AddressType=req.body.addressType
  
      console.log("step 1");
      const stringRegex=/^[a-zA-Z]+(?: [a-zA-Z]+)?$/;
      const mobileRegex=/^\d{10}$/
      const pincoderegex=/^\d{6}}$/
      console.log("step 2");
      if(!stringRegex.test(Name) || !stringRegex.test(Locality)|| !stringRegex.test(City) || !stringRegex.test(State)  )
      {
        console.log(" string regex failed");
        const data=[false,"failed saved address"]
        res.json(data)
  
      }
      else
      {
        if(!mobileRegex.test(Mobile))
        {
          console.log(" mobile regex failed");
          const data=[false,"failed saved address"]
          res.json(data)
  
        }
        else
        {
          console.log("step 3");
          const userId=new ObjectId(req.session.user_id)
            const isLogin=req.session.loginStatus
            const UserData=await User.findById({_id:userId})
            console.log("userId Is>>>>",userId)
          const newAddress=new Address({
            name:Name,
            mobile:Mobile,
            pincode:Pincode,
            locality:Locality,
            address:address,
            city:City,
            state:State,
            landmark:Landmark,
            alterMobile:AltMobile,
            addressType:AddressType,
            userId:userId
          })
          
          console.log("step 4");
          console.log(newAddress);
          const SavedAddress=await newAddress.save()
          console.log("step 5");
          const userAddressCount=await Address.countDocuments({userId:userId})
          console.log(userAddressCount);
          if(userAddressCount===1)
          {
            UserData.deafultAddrss=newAddress._id
            UserData.save()
          }
          if(SavedAddress)
          {
            console.log("step 6");
            console.log(isLogin,{isLogin:isLogin,userId:UserData});
            console.log("heloo address");
            const data=[true,"sccuess saved address"]
            console.log("step 7");
            res.json(data)
          }
          else
          {
            console.log("step 8");
            console.log(" some address saving failed");
          const data=[false,"failed saved address"]
          res.json(data)
          }
         
  
        }
  
      }
  
      // res.redirect('/home/userAddress')
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }
  
  //edit address
  const editAddress=async(req,res)=>{
    try {
      console.log("edit address started");
      console.log(req.query.addressId);
      const addressId=new ObjectId(req.query.addressId)
      console.log("address idd",addressId);
      
      const userId=new ObjectId(req.session.user_id)
      const isLogin=req.session.loginStatus
      const UserData=await User.findById({_id:userId})
      console.log(userId)
      console.log(isLogin);
      const addressDetails=await Address.findById({_id:addressId},{isDeleted:false})
      console.log(addressDetails);
      console.log("edit  end");
      
      res.render('editAddress',{isLogin:isLogin,userId:UserData,address:addressDetails})
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }
  
  //update Edit Address
  const updateEditAddress=async(req,res)=>{
    try {
      console.log("updateEditAddress");
      const addressId=new ObjectId(req.body.addressId)
      console.log(addressId);
      const Name=req.body.userName
      const Mobile=req.body.userMobile
      const Pincode=req.body.userPincode
      const Locality=req.body.userLocality
      const address=req.body.userAddress
      const City=req.body.userCity
      const State=req.body.userState
      const Landmark=req.body.userLandmark
      const AltMobile=req.body.userAltMobile
      const AddressType=req.body.addressType

      console.log("step 1");
      const stringRegex=/^[a-zA-Z]+(?: [a-zA-Z]+)?$/;
      const mobileRegex=/^\d{10}$/
      const pincoderegex=/^\d{6}}$/
      console.log("step 2");
      if(!stringRegex.test(Name) || !stringRegex.test(Locality)|| !stringRegex.test(City) || !stringRegex.test(State)  )
      {
        console.log(" string regex failed");
        const data=[false,"failed saved address"]
        res.json(data)
  
      }
      else
      {
        if(!mobileRegex.test(Mobile))
        {
          console.log(" mobile regex failed");
          const data=[false,"failed saved address"]
          res.json(data)
        }
        else
        {
          console.log("step 3");
          const userId=new ObjectId(req.session.user_id)
            const isLogin=req.session.loginStatus
            const UserData=await User.findById({_id:userId})
            console.log("userId Is>>>>",userId)
            const updatedAddress=await Address.findByIdAndUpdate({_id:addressId},{$set:{name:Name,mobile:Mobile,pincode:Pincode,locality:Locality,address:address,city:City,state:State,landmark:Landmark,alterMobile:AltMobile,addressType:AddressType}})
            console.log(updatedAddress);
            if(updatedAddress)
            {
              console.log("step 6");
              console.log(isLogin,{isLogin:isLogin,userId:UserData});
              console.log("heloo address");
              const data=[true,"sccuess saved address"]
              console.log("step 7");
              res.json(data)
            }
            else
            {
              console.log("step 8");
              console.log(" some address saving failed");
            const data=[false,"failed saved address"]
            res.json(data)
            }
  
        }
      }
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }
  
  
  //delete address
  const deleteAddress=async(req,res)=>{
    try {
      console.log("delete address started");
      const addressId=new ObjectId(req.query.addressId)
      const userId=new ObjectId(req.query.userId)
      console.log(userId);
      console.log(addressId);
      // await Address.findByIdAndDelete({_id:addressId})
      const deleteAddress=await Address.findById({_id:addressId})
      deleteAddress.isDeleted=true
      await deleteAddress.save()
      const userAddress=await Address.find({userId:userId})
      const UserData=await User.findById({_id:userId})
      const isLogin=req.session.loginStatus
      console.log("delete address end");
      res.render('userAddress',{isLogin:isLogin,userId:UserData,address:userAddress})
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }

module.exports={
    userAddress,
    loadAddAddress,
    uploadAddAddress,
    editAddress,
    updateEditAddress,
    deleteAddress,
}
