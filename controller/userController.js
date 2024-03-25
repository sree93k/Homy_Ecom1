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
const Banner=require('../model/banner')
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


//user login page
const userLogin = async (req, res) => {
  try {
    res.set("Cache-control","no-store")
    console.log("login startted...");
    const login_error=req.session.login_error
    req.session.login_error=" "
    console.log(req.session.loginStatus)
    res.render("login",{login_error:login_error});
  } catch (error) {
    console.log(error);
    res.render('errorPage')
  }
};

//user logout
const userLogout=async(req,res)=>{
  try {

  req.session.destroy()
   console.log("LOGOUT-->>user logout and to main home")
    // res.redirect('/home')
    res.json("logout")
  } catch (error) {
    console.log(error)
    res.render('errorPage')
  }
}


//user login verification
const userVerify = async (req, res) => {
  try {
    console.log("step1 ");
    const email = req.body.email;
    const password = req.body.password;
    console.log("step2 ");
    const userData = await User.findOne({ email: email });
    if (userData) {
      console.log("step3");
      const passwordMatch = await bcrypt.compare(password, userData.password);
      console.log(email)
      console.log(userData.email)
      console.log(password)
      console.log(userData.password)
      console.log(passwordMatch)
      if (passwordMatch) {
        if(!userData.isBlocked)
        {
          if(userData.isVerified)
          {
            console.log(userData.isBlocked)
          console.log("step 4 success login");
          req.session.loginStatus=true
           const loginStatus=req.session.loginStatus
           console.log(loginStatus)
           console.log("verify login")
           req.session.user_id=userData._id;
           res.set("Cache-control","no-store")
          // res.render("home",{loginStatus:loginStatus});

           
          res.redirect('/home')
          }
          else
          {
            console.log("step -is verified failed login ");
            req.session.login_error="Account Not Exist"
            res.redirect("/login");
          }
        }
        else
        {
          console.log("step -blocked failed login ");
        
        req.session.login_error="Account is Blocked"
        res.redirect("/login");
        }
       
      } else {
      
        console.log("step -5 failed login ");
        req.session.login_error="Invalid Password"
        res.redirect("/login");
      }
    } else {
     
      console.log("step-6 failed login ");
      req.session.login_error="Account Not Exist"
      res.redirect("/login");
    }
  } catch (error) {
   
    console.log(error);
    res.render('errorPage')
  }
};

//user SignUp Page
const userRegistration = async (req, res) => {
  try {
    console.log("register get");
    console.log("register page 1")
    res.set("Cache-control","no-store")
    res.render("registration",{});
    console.log("register page 2")
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error'); 
    res.render('errorPage')
  }
};


//node mailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});


// otp creating 
const secret=speakeasy.generateSecret({length:20})


//create new User
const createUser=async(req,res,next)=>{
  try {
    console.log("step 0");
    
    const name = req.body.name;
    const email = req.body.email;
    const mobile = req.body.mobile;
    const password = req.body.password;
    const password_1 = req.body.password_1;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const nameRegex=/^[a-zA-Z]+(?: [a-zA-Z]+)?$/;
    const mobileRegex=/^\d{10}$/
    const passwordRegex=/^[a-zA-Z0-9!@#$%^&*]+\S{8}$/
    console.log("step 1");
    console.log(password);
    console.log(name)
    console.log(email);
    console.log(mobile);
    console.log(password.includes(" "));
    console.log("step 1 .1")
    if (!emailRegex.test(email)) {
      console.log("error1");
      res.json("Invalid Email ID")
    } 
    else
     {
      console.log(password)
      console.log(password_1)
      console.log(password.includes(" "))
      if (password !== password_1 ) {
        console.log("error password incorrect");
        res.json("Incorrect Password")
      } else {
        if(!passwordRegex.test(password))
        {
          console.log("error passwordRgex");
          res.json("Invalid Password")
        }
        else
        {
          if(!mobileRegex.test(mobile))
          {
            console.log("error mobileRegex");
            res.json("Invalid Mobile Number")

          }
          else
          {
            if(!nameRegex.test(name))
            {
              console.log("error mobileRegex");
              res.json("Invalid Input")

            }
            else
            {
              const existingUser = await User.findOne({ email: email });
              console.log("besr ",existingUser)
        if (existingUser) {
          console.log("existingUser",existingUser)
          console.log("error3");
          console.log("existing email")
          res.json("Existing email id")
          // res.redirect("/home/register")
        } else {
          if(name.includes(" ") || email.includes(" ") || mobile.includes(" ") )
          {
            console.log("error4");
            res.json("Please Avoid Spaces")
          }
          else
          {
            console.log("signup successfully verified ")
            const spassword = await securePassword(req.body.password);
          console.log("step 2")
         
         

          const user = new User({
            name: name,
            email: email,
            mobile: mobile,
            password: spassword,
            isVerified:false,
            image:"1706273704356-user_4385254.png",
            totalCart:0,
          });
          
          console.log("User details"+user)
          //checking the session exists or not
          console.log("step 3")
          req.session ? console.log('session exits'):console.log("session error");
          req.session.userData=user;
          console.log("step 4")
          
          
          console.log(req.session.userData)
          console.log("step 5")
          console.log("step 6")
          
            const otp=speakeasy.totp({
              secret:secret.base32,
              encoding:"base32"
            })
            console.log("user email sesion", );
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
            console.log(mailOptions)
           
            transporter.sendMail(mailOptions,(error,info)=>{
              if(error){
                console.log("failed to send",error)
                return res.status(500).json({error:"Failed to send OTP"})
              }
              else{
               
               console.log("User Details"+user._id)
                console.log('email sent '+ info.response)
                const data=[user._id,"Mail Sent Successfully"]
                // return res.status(200).json({userId:user._id,info:"Mail Sent Successfully"})
                res.json(data)
              }
            })
            console.log("otp page is loaded succesfully");
          
            // res.render("verifyotp.ejs");
            // res.json({success:true})
          } 
        }
            }
          }
          

        }
        
      }
    }
    
  } catch (error) {
    console.log("userCreation not working")
    // res.redirect('/admin/register')
    console.log("failed to send",error)
    return res.status(500).json({error:false})
  
  }
}


//Home page after  login
const homePageLogin=async(req,res)=>{
  try {
    res.set("Cache-control","no-store")
    console.log("home redirect login")
    req.session.loginStatus=true
    const loginStatus=req.session.loginStatus
    req.session.orderConfirmed=false
    req.session.checkout=true
  
    const userId=new ObjectId(req.session.user_id)
    console.log(userId)
    const UserData=await User.findById({_id:userId})
    console.log('home page logouts')
    console.log(UserData)
    const allBanners = await Banner.find({}).sort({ createdAt: -1 });
    console.log("allBanners",allBanners);
    res.render('home',{loginStatus:loginStatus,userId:UserData,allBanners:allBanners})
    
  } catch (error) {
    console.log(error)
    res.render('errorPage')
  }
}


//Home page after logout
const homePageLogout=async(req,res)=>{
  try {
    res.set("Cache-control","no-store")
    console.log("home redirect logout")
    req.session.loginStatus=false
    const loginStatus=req.session.loginStatus
    if(req.query.ref)
    {
      console.log("log query is ",req.query.ref);
      req.session.refferalUserId=req.query.ref
      console.log("this is",req.session.refferalUserId);
    }
    console.log('home page login')
    console.log(loginStatus)
    const allBanners=await Banner.find({})
    console.log("allBanners",allBanners);
    res.render('home',{loginStatus:loginStatus,allBanners:allBanners})
    
  } catch (error) {
    console.log(error)
    res.render('errorPage')
  }
}



const userProfile=async(req,res)=>{
  try {
    console.log("user profile");
    const userId=new ObjectId(req.session.user_id)
    const isLogin=req.session.loginStatus
    const UserData=await User.findById({_id:userId})
    console.log(UserData)
    console.log(isLogin);
    res.render('userProfile',{isLogin:isLogin,userId:UserData})
  } catch (error) {
    console.log(error);
    res.render('errorPage')
  }
}


//edit user profile

const editUserProfile=async(req,res)=>{
  try {
    console.log("user edit started");
    
    console.log(req.query.id);
    console.log(req.query.id1);
    console.log("my body is",req.body);
    console.log("my file is",req.file);
    console.log(req.body.updateOn);
    let updateOn;
    if(req.query.id1)
    {
      updateOn=req.query.id1
    }
    else
    {
     updateOn=req.body.updateOn
    }
    const userId=new ObjectId(req.query.id)

    const userData=await User.findById({_id:userId})
    // console.log(userData);
    switch(updateOn)
    {
      case "name": userData.name=req.body.userName
                    console.log("name saved");
                    break;
      case "gender": userData.gender=req.body.userGender.gender
                      console.log("gender saved");
                    break;
      case "dob":   const DOB=req.body.userDob
                    const dateObject=moment(DOB)
                    console.log();
                    const fullDate=dateObject.format("YYYY-MM-DD")
                    console.log("fullDate",fullDate);
                    userData.dob=fullDate
                    console.log("dob saved");
                    break;
      case "email": userData.email=req.body.userEmail
                    console.log("email saved");
                    break;
      case "mobile":userData.mobile=req.body.userMobile
                    console.log("mobile saved");
                    break;
      case "image":userData.image=req.file
                    console.log("image saved");
                    break;
      default:           
    }
    await userData.save()
    console.log("successfully saved");
    console.log(userData);
    res.json(userData)
  } catch (error) {
    console.log(error);
    res.render('errorPage')
  }
}


//checkout
const checkout=async(req,res)=>{
  try { 
    console.log("checkout starting>>>>>>>>>");
    console.log("body",req.body);
    let cartTotalPrice=Number(req.body.cartTotalPrice)
    let cartTotalDelivery=Number(req.body.cartTotalDelivery)
    console.log("cartTotalPrice", cartTotalPrice);
    console.log("cartTotalDelivery",cartTotalDelivery);
    const userId=req.session.user_id
    const isLogin=req.session.loginStatus
    const fromCart=req.query.id
    console.log("from is",fromCart);
    console.log("req.session.user_id ",req.session.user_id);
    console.log("mow what >>>step1 ");
    const UserData=await User.findById({_id:userId})
    console.log("mow what >>>step2 ");
    console.log(UserData);
    console.log("step 1");
    const defaultAddressId=new ObjectId(UserData.deafultAddrss)
    const userCart=await UserCart.find({userId:userId}).populate('productId')
    const defaultAddress=await Address.findById({_id:defaultAddressId})
    console.log(defaultAddress);
    console.log("step 2");
    const allAddress=await Address.find({userId:userId})
    console.log(allAddress);
    console.log(userId)
    console.log(isLogin);
    const couponData=await Coupon.find({})
    console.log("couponData is ...",couponData);
    req.session.checkout=true
    let applycouponData;
    let totalPrice;
    console.log("total price",totalPrice);
    let totalCart;
    if(req.session.couponId)
    {
      console.log("news 1");
      applycouponData=new ObjectId(req.session.couponId)
      applycouponData=await Coupon.findById({_id:applycouponData})
      applycouponData.couponValue=req.session.couponValue
      totalPrice=UserData.totalCart+req.session.couponValue
      totalCart=UserData.totalCart+cartTotalDelivery
      await applycouponData.save()
      console.log("appliedCouponData is>>>>>>>>>>>>" ,applycouponData.couponId);
    }
    else
    {
      console.log("news 2");
      applycouponData=0
      totalPrice=UserData.totalCart
      totalCart=UserData.totalCart+cartTotalDelivery
    }
    await UserData.save()
    console.log("applycouponData is>>>>>>>>>>>>>>>>>>>>",applycouponData);
    res.render('checkout',{isLogin:isLogin,userId:UserData,cartItem:userCart,address:defaultAddress,Address:allAddress,couponData:couponData,applycouponData:applycouponData,deliveryCharge:cartTotalDelivery,totalPrice:totalPrice,totalCart:totalCart})
  } catch (error) {
    console.log(error);
    res.render('errorPage')
  }
}


//addressSelection
const addressSelection=async(req,res)=>{
  try {
    console.log("address selection");
    const defaultAddress=new ObjectId(req.body.address)
    console.log(defaultAddress);
    const userId=req.session.user_id
    const userData=await User.findById({_id:userId})
    userData.deafultAddrss=defaultAddress
    userData.save()
    console.log(userData);
    res.json(userData)
  } catch (error) {
    console.log(error);
    res.render('errorPage')
  }
}


//wish list
const userWishlist=async(req,res)=>{
  try {
    console.log("user wishlist start");
    const userId=new ObjectId(req.session.user_id)
    const isLogin=req.session.loginStatus
    const UserData=await User.findById({_id:userId})
    console.log(userId)
    console.log(isLogin);
    const userWishList=await Wishlist.findOne({userId:userId}).populate('productId')
    const userproduct=userWishList.productId
    console.log("userproduct >>",userproduct);
    console.log("user wishlist is ",userWishList);
    res.render('userWishlist',{isLogin:isLogin,userId:UserData,userWishList:userproduct})
    
  } catch (error) {
    console.log(error);
    res.render('errorPage')
  }
}


const userReferals=async(req,res)=>{
  try {
    console.log("user user coupons start");
    const userId=new ObjectId(req.session.user_id)
    const isLogin=req.session.loginStatus
    const UserData=await User.findById({_id:userId})
    const totalReferrals = UserData.referrals.reduce((acc, curr) => acc + curr.amount, 0);
    console.log(userId)
    console.log(isLogin);
    res.render('userReferals',{isLogin:isLogin,userId:UserData,totalReferrals:totalReferrals})
  } catch (error) {
    console.log(error);
    res.render('errorPage')
  }
}



module.exports = {
  userLogin,
  userLogout,

  userVerify,
  userRegistration,
  createUser,
 
  homePageLogin,
  homePageLogout,

  userProfile,
  editUserProfile,

  checkout,
  addressSelection,
  userWishlist,

  userReferals
};
