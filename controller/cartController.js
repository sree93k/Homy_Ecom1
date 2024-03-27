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

const userCart=async(req,res)=>{
    try {
      console.log("usercart");
      const userId=new ObjectId(req.session.user_id)
      const isLogin=req.session.loginStatus
      const UserData=await User.findById({_id:userId})
      console.log(UserData)
      console.log(isLogin);
      console.log("step1");
      console.log(UserData.cart);
      const userCart=await UserCart.find({userId:userId}).populate('productId')
      console.log("step1");
      UserData.save()
      console.log(userCart);
      let cartCount;
      if(userCart)
      {
        cartCount=userCart.length;
      }
      else
      {
        cartCount=0;
      }
       
      res.render('userCart',{isLogin:isLogin,userId:UserData,cartItem:userCart,cartCount:cartCount})
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }
   
  
  //add to cart
  
  const addToCart=async(req,res)=>{
    try {
      console.log("add to cart startedddd>>>>");
      const productId=new ObjectId(req.body.productId)
      const userId=new ObjectId(req.session.user_id)

      console.log(productId);
      console.log(userId);
      const existingCart=await UserCart.findOne({userId:userId,productId:productId})
      const userData=await User.findById({_id:userId})
      if(existingCart)
      {
        console.log("existing cart");
        const data=[false,"alredy exists item"]
        res.json(data)
      }
      else
      {
        console.log("cart not existing");
        
        console.log(productId);
        console.log(userId);
        const productDetails=await Product.findById({_id:productId})
        if(productDetails.productQuantity>0)
        {
          console.log("details",productDetails);
          console.log("product price",productDetails.productPrice);
          const newItem=new UserCart({
            userId:userId,
            productId:productId,
            quantity:1,
            name:productDetails.productName,
            description:productDetails.productDescription,
            price:productDetails.productPrice,
            totalPrice:productDetails.productPrice,
            totalAmount:productDetails.productPrice,
            status:"Pending"
          })
          await newItem.save()
          const addedItem=await UserCart.findOne({userId:userId,productId:productId})
          console.log("added item",addedItem);
          const userData=await User.findById({_id:userId})
          console.log("user last data",userData);
           // const newCart=cartData.cartItems.push(addItem._id);
           console.log("new itwm price",newItem.price);
           
          userData.totalCart=userData.totalCart+newItem.totalPrice
          userData.save()
          console.log("userdata price",userData.totalCart);
          console.log("user new data",userData);
          const data=[true,"successfully added item"]
          res.json(data)
  
        }
        else
        {
          console.log("no stock");
          const data=[false,"No Stock"]
          res.json(data)
  
        }
   
      }
     
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }
  
  
  //remove cart
  const removeCart=async(req,res)=>{
    try {
      console.log("remove cart start");
      const cartId=req.body.cartId
      console.log(cartId);
      const userId=req.session.user_id
      const cartDetails=await UserCart.findOne({_id:cartId})
      const userData=await User.findById({_id:userId})
      console.log("cart deatsils", cartDetails);
      if(cartDetails)
      {
        console.log("step1 ");
        userData.totalCart=userData.totalCart-cartDetails.totalPrice
        await userData.save()
        await UserCart.findByIdAndDelete({_id:cartId})
        
        const newCart=await UserCart.findOne({userId:userId})
        console.log("new cart ",newCart);
        if(newCart===null)
        {
          userData.totalCart=0
          await userData.save()
          req.session.couponId=0
        }
        console.log("cart length",cartDetails);
        const data=[true,"remove succesfully"]
        res.json(data)
      }
      else
      {
       
        const data=[false,"remove failed"]
        res.json(data)
      }
      
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }
  
  
  //cart quantity
  const cartQuantity = async (req, res) => {
    try {
      console.log("cart quantity start");
      const cartId = req.body.cartId;
      const quantity = req.body.quantity;
      console.log(cartId);
      console.log(quantity);
      const cartDetails = await UserCart.findById({ _id: cartId });
      const userId = req.session.user_id;
      console.log(cartDetails);
      const UserData = await User.findById({ _id: userId });
      if (quantity) {
        console.log("increment");
  
        cartDetails.quantity = cartDetails.quantity + 1;
        UserData.totalCart=UserData.totalCart+ (cartDetails.totalPrice/(cartDetails.quantity-1));
      } else {
        console.log("decrement");
        if (cartDetails.quantity > 1) {
          console.log("greater than zero");
         
         
          UserData.totalCart=UserData.totalCart- (cartDetails.totalPrice/cartDetails.quantity);
          cartDetails.quantity = cartDetails.quantity - 1;
        }
      }
      console.log("after incremnet and decremnet");
      cartDetails.totalPrice = cartDetails.price * cartDetails.quantity;
      cartDetails.totalAmount=cartDetails.totalPrice
      await cartDetails.save();
  
      // Calculate total cart price
      
       
  
      await UserData.save();
  
      const data = [cartDetails,UserData];
      res.json(data);
  
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }


  module.exports={
    userCart,
    addToCart,
    removeCart,
    cartQuantity,
  }