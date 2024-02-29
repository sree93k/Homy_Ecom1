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



//password encrypting
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error);
  }
};

//user login page
const userLogin = async (req, res) => {
  try {
    res.set("Cache-control","no-store")
    const login_error=req.session.login_error
    req.session.login_error=" "
    console.log(req.session.loginStatus)
    res.render("login",{login_error:login_error});
  } catch (error) {
    console.log(error);
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
      otp:otp
    })
    console.log(otpDB)
    console.log("error occuered 1");
    await otpDB.save()
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
          res.redirect('/home/home')
          }
          else
          {
            console.log("step -is verified failed login ");
            req.session.login_error="Account Not Exist"
            res.redirect("/home/login");
          }
        }
        else
        {
          console.log("step -blocked failed login ");
        
        req.session.login_error="Account is Blocked"
        res.redirect("/home/login");
        }
       
      } else {
      
        console.log("step -5 failed login ");
        req.session.login_error="Invalid Password"
        res.redirect("/home/login");
      }
    } else {
     
      console.log("step-6 failed login ");
      req.session.login_error="Account Not Exist"
      res.redirect("/home/login");
    }
  } catch (error) {
   
    console.log(error);
  }
};

//user SignUp Page
const userRegistration = async (req, res) => {
  try {
    
    console.log("register get");

    if(req.query.ref)
    {
      req.session.refferalUserId=req.query.ref
    }
    console.log("register page 1")
    res.set("Cache-control","no-store")
    res.render("registration");
    console.log("register page 2")
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error'); // Handle any unexpected errors
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
              console.log(User.email)
        if (existingUser) {
          console.log(existingUser)
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
    console.log(error)
  }
}



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
      console.log("new user is ",newUser);

      const userData = await newUser.save();
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
          userId:userData._id,
   
        })
        await newUserWishList.save()

        let userReferals;
        if(req.session.refferalUserId)
         {
          const userID=new ObjectId(req.session.refferalUserId)
          console.log("referal user Id:",userID);
           userReferals={
             amout:100,
             date:new Date(),
           }
           const userData=await User.findById({_id:userID})
           userData.referrals.unshift(userReferals)
           userData.save()
           delete req.session.refferalUserId;
           console.log("user referals >>",userData);
           console.log("finish >>>>>>>>>>>>>");
         }

        const newUserWallet=new Wallet({
          userId:actualOtp.userId,
          balance:0
        })
        await newUserWallet.save()
        
        // res.redirect('/home')
        res.json(true)
      }
      else
      {
        console.log("otp error occured 1")
       await User.findByIdAndDelete({_id:otpUserId})
      //  await OTP.findByIdAndDelete({userId:otpUserId})
        console.log("Incorrect OTP");
        // res.redirect('/home')
        res.json(false)
  
      }
    }
    else
    {
      await User.findByIdAndDelete({_id:otpUserId})
      console.log("otp error occured 2")
      // console.log(actualUserId)
      // await OTP.findByIdAndDelete({userId:actualUserId})
      console.log("Incorrect OTP");
        // res.redirect('/home')
        res.json(false)
    }
    
    
    
    
    // return res.status(200).json({info:"Otp verified Successfully"})
    
  } catch (error) {
    console.log(error)
    // res.status(500).json({ success: false, message: 'Internal Server Error' });
    
  }
}


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
  }
}


//Home page after  login
const homePageLogin=async(req,res)=>{
  try {
    res.set("Cache-control","no-store")
    console.log("home redirect logout")
    req.session.loginStatus=true
    const loginStatus=req.session.loginStatus
    req.session.orderConfirmed=false
    req.session.checkout=true
    const userId=new ObjectId(req.session.user_id)
    console.log(userId)
    const UserData=await User.findById({_id:userId})
    console.log('home page logouts')
    console.log(UserData)
    res.render('home',{loginStatus:loginStatus,userId:UserData})
    
  } catch (error) {
    console.log(error)
  }
}


//Home page after logout
const homePageLogout=async(req,res)=>{
  try {
    res.set("Cache-control","no-store")
    console.log("home redirect login")
    req.session.loginStatus=false
    const loginStatus=req.session.loginStatus

    console.log('home page login')
    console.log(loginStatus)
    res.render('home',{loginStatus:loginStatus})
    
  } catch (error) {
    console.log(error)
  }
}


//category home after login
const homeCategoryLogin=async(req,res)=>{
  try {
    res.set("Cache-control","no-store")
    console.log("home category started now ......");
    let allProducts;
    if(req.session.searchList)
    {
      
      const products=new ObjectId(req.session.searchList)
      console.log("search startedd..",products);
       allProducts=await Product.find({_id:products})
       console.log(allProducts);
       delete req.session.searchList;
    }
    else
    {
       allProducts=await Product.find({})
    }

    const loginStatus=req.session.login_status=true
    console.log(loginStatus)
    const allCategory=await Category.find({})
    console.log(allCategory);
    const userId=new ObjectId(req.session.user_id)
  
    const UserData=await User.findById({_id:userId})
    console.log(UserData)

    const userWish=await Wishlist.findOne({userId:userId})
    if(userWish)
    {
      console.log("userWishlist is >>>>>>",userWish);
      const userWishlist=userWish.productId
      console.log("?>>>",userWishlist);
      
      res.render('category',{products:allProducts,loginStatus:loginStatus,category:allCategory,userId:UserData,categoryName:"All Category",userWishlist: JSON.stringify(userWishlist)})
    }
    else
    {
      res.render('category',{products:allProducts,loginStatus:loginStatus,category:allCategory,userId:UserData,categoryName:"All Category",userWishlist:null})
    }

  } catch (error) {
    console.log(error)
  }
} 

//category List after login
const categoryList=async(req,res)=>{
  try {
    res.set("Cache-control","no-store")
    console.log("category list started");
    const category=req.query.id
    console.log(req.session.user_id);
    const userId=new ObjectId(req.session.user_id)
    console.log("step 1");
    console.log(category);
    const categoryId=new ObjectId(category)
    console.log(categoryId);
    const CategoryData=await Category.findById({_id:category})
    console.log("step 2");
    console.log(CategoryData);
    console.log("step 3");
    const categoryProductsList=await Product.find({productCategory:CategoryData._id})
    console.log("category lists of products");
    console.log(categoryProductsList);
    const loginStatus=req.session.login_status=true
    // console.log(loginStatus)
    // res.json(categoryProductsList)
    console.log("Yess",CategoryData.categoryName);
    const allCategory=await Category.find({})
    // console.log(allCategory);
    const UserData=await User.findById({_id:userId})
    console.log(UserData)
    const userWishlist=await Wishlist.findOne({userId:userId})
    if(CategoryData.categoryName==="All Category")
    {
      res.redirect('/home/category')
    }
    else
    {
      res.render('category',{loginStatus:loginStatus,category:allCategory,products:categoryProductsList,userId:UserData,categoryName:CategoryData.categoryName,userWishlist: JSON.stringify(userWishlist)})
      console.log("last");

    }
  } catch (error) {
    console.log(error)
  }
}


//searchCategory
const searchCategory = async (req, res) => {
  try {
    console.log("searchCategory >>>>>");
    const query = req.query.search.toLowerCase();
    const productsData = await Product.find({});
    

    const results = productsData.filter(product => product.productName.toLowerCase().startsWith(query))
                                .sort((a, b) => a.productName.localeCompare(b.productName));

    res.json(results);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}




// productSearch
const productSearch=async(req,res)=>{
  try {
    console.log("productSearch >>>");
    const productId=new ObjectId(req.query.productId)
    console.log("prodcuct id is ,", productId);
    req.session.searchList=productId
    
    res.json(productId)
    } catch (error) {
    console.log(error);
  }
}


// addToWishlist
const addToWishlist=async(req,res)=>{
  try {
    console.log("addToWishlist started>>>>");
    const productId=new ObjectId(req.query.productId)
    const userId=new ObjectId(req.session.user_id)
    console.log(productId);
    console.log(userId);
    const userWishList=await Wishlist.findOne({userId:userId})
    console.log("the wishlist is ",userWishList);

    const exists = userWishList.productId.some(id => id.equals(productId));
    if (exists) {
  
      res.json(false);
      return;
    }
   
   userWishList.productId.unshift(productId)
   await userWishList.save()

    const data=true
    res.json(data)
    
  } catch (error) {
    console.log(error);
  }
}


//removeFromWishlist
const removeFromWishlist=async(req,res)=>{
  try {
    console.log("removeFromWishlist started");
    const productId=new ObjectId(req.query.productId)
    const userId=new ObjectId(req.session.user_id)
    console.log(productId);
    console.log(userId);
    const userWishList=await Wishlist.findOne({userId:userId})
    console.log("the wishlist is ",userWishList);
    const indexToRemove = userWishList.productId.indexOf(productId);
      if (indexToRemove !== -1) {
          userWishList.productId.splice(indexToRemove, 1); 
      }
    await userWishList.save()
    console.log(userWishList);
    const data=true
    res.json(data)
  } catch (error) {
    console.log();
  }
}

//checkWishlist
const checkWishlist=async(req,res)=>{
  try {
    console.log("checkWishlist  started");
    const productId=new ObjectId(req.query.productId)
    console.log(productId);
    const userId=req.session.user_id
    const userWishList=await Wishlist.findOne({userId:userId})
    const exists = userWishList.productId.some(id => id.equals(productId));
    if (exists) {
  
      res.json(productId);
      return;
    }

    
  } catch (error) {
    console.log(error);
  }
}


//priceFilter

const priceFilter=async(req,res)=>{
  try {
    console.log("price filter started");
    const minPrice=Number(req.body.minPrice)
    const maxPrice=Number(req.body.maxPrice)
    const categoryName=req.body.categoryName
    const userId=new ObjectId(req.session.user_id)
    console.log(typeof(minPrice));
    console.log(maxPrice);
    console.log(categoryName);
    const loginStatus=req.session.login_status
    const categoryData=await Category.findOne({categoryName:categoryName})
    const allCategory=await Category.find({})
    console.log(categoryData);
    let categoryProductsList;
    console.log(categoryProductsList);
    const UserData=await User.findById({_id:userId})
    console.log(UserData)
    if(categoryName==="All Category")
    {
      console.log("alla caregory all prodciutsss");
       categoryProductsList=await Product.aggregate([{$match:{productPrice:{$gte:minPrice,$lte:maxPrice}}}])
      console.log("second");
      res.render('category',{products:categoryProductsList,loginStatus:loginStatus,category:allCategory,userId:UserData,categoryName:"All Category"})

    }
    else
    {
      console.log("price filter end");
       categoryProductsList=await Product.aggregate([{$match:{productCategory:categoryData._id,productPrice:{$gte:minPrice,$lte:maxPrice}}}])
      
      res.render('category',{loginStatus:loginStatus,category:allCategory,products:categoryProductsList,userId:UserData,categoryName:categoryName})
      console.log("last");
    }


  } catch (error) {
    console.log(error);
  }
}



//user Rating
const productRating=async(req,res)=>{
  try {
    console.log("product rating started");
    const productRating=req.body.productRate
    const categoryName=req.body.categoryName
    const userId=new ObjectId(req.session.user_id)
    console.log(productRating);
    console.log(categoryName);
    const loginStatus=req.session.login_status
    const categoryData=await Category.find({categoryName:categoryName})
    const allCategory=await Category.find({})
    const UserData=await User.findById({_id:userId})
    console.log(UserData)
    let ratingValue;
    switch(productRating)
    {
      case "fourRating": ratingValue=4;
                          break;
      case "threeRating": ratingValue=3;
                          break; 
      case "twoRating": ratingValue=2;
                          break;
      case "oneRating": ratingValue=1;
                          break;                                     
    }
    console.log("the ratingvalue is ",ratingValue);

    let categoryProductsList;
    if(categoryName==="All Category")
    {
      console.log("alla caregory all prodciutsss");
       categoryProductsList=await Product.aggregate([{$match:{productRating:{$gte:ratingValue}}}])
      console.log("second");
      res.render('category',{loginStatus:loginStatus,category:allCategory,products:categoryProductsList,userId:UserData,categoryName:"All Category"})

    }
    else
    {
      console.log("price filter end");
       categoryProductsList=await Product.aggregate([{$match:{productCategory:categoryData._id,productRating:{$gte:ratingValue}}}])
      
      res.render('category',{loginStatus:loginStatus,category:allCategory,products:categoryProductsList,userId:UserData,categoryName:categoryName})
      console.log("last");
    }
    
  } catch (error) {
    console.log(error);
  }

}

//sorting
const sorting=async(req,res)=>{
  try {
    console.log("sorting starting");
    const sortingValue=req.query.id
    const categoryName=req.query.catId
    console.log(sortingValue);
    console.log("cat id",categoryName);
    const loginStatus=req.session.login_status
    const allCategory=await Category.find({})
    const userId=new ObjectId(req.session.user_id)
    const UserData=await User.findById({_id:userId})
    let categoryData;

    
    let categoryProductsList;
    switch(sortingValue)
    {
      case "Popularity":if(categoryName==="All Category")
                          {
                            categoryProductsList=await Product.aggregate([{$sort:{productRating:1}}])
                          }
                          else
                          {
                            categoryData=await Category.findOne({categoryName:categoryName})
                            categoryProductsList=await Product.aggregate([{$match:{productCategory:categoryData._id}},{$sort:{productRating:1}}])
                          }
                        break;
      case "New Arrival":if(categoryName==="All Category")
                          {
                            categoryProductsList=await Product.aggregate([{$sort:{createdDate:-1}}])
                          }
                          else
                          {
                            categoryData=await Category.findOne({categoryName:categoryName})
                            categoryProductsList=await Product.aggregate([{$match:{productCategory:categoryData._id}},{$sort:{createdDate:-1}}])
                          }
                        break;
      case "Avg. Customer Review":if(categoryName==="All Category")
                                  {
                                    categoryProductsList=await Product.aggregate([{$sort:{productRating:1}}])
                                  }
                                  else
                                  {
                                    categoryData=await Category.findOne({categoryName:categoryName})
                                    categoryProductsList=await Product.aggregate([{$match:{productCategory:categoryData._id}},{$sort:{productRating:1}}])
                                  }
                                break;
      case "Price: High to Low":if(categoryName==="All Category")
                                {
                                  categoryProductsList=await Product.aggregate([{$sort:{productPrice:-1}}])
                                }
                                else
                                {
                                  categoryData=await Category.findOne({categoryName:categoryName})
                                  categoryProductsList=await Product.aggregate([{$match:{productCategory:categoryData._id}},{$sort:{productPrice:-1}}])
                                }
                              break;
      case "Price: Low To High":if(categoryName==="All Category")
                                {
                                  categoryProductsList=await Product.aggregate([{$sort:{productPrice:1}}])
                                }
                                else
                                {
                                  categoryData=await Category.findOne({categoryName:categoryName})
                                  categoryProductsList=await Product.aggregate([{$match:{productCategory:categoryData._id}},{$sort:{productPrice:1}}])
                                }
                              break;
      case "A - Z":if(categoryName==="All Category")
                                {
                                  categoryProductsList=await Product.aggregate([{$sort:{productName:1}}])
                                }
                                else
                                {
                                  categoryData=await Category.findOne({categoryName:categoryName})
                                  categoryProductsList=await Product.aggregate([{$match:{productCategory:categoryData._id}},{$sort:{productName:1}}])
                                }
                              break;
      case "Z - A":if(categoryName==="All Category")
                      {
                        categoryProductsList=await Product.aggregate([{$sort:{createdDate:-1}}])
                      }
                      else
                      {
                        categoryData=await Category.findOne({categoryName:categoryName})
                        categoryProductsList=await Product.aggregate([{$match:{productCategory:categoryData._id}},{$sort:{productName:-1}}])
                      }
                    break;
      
    }

    res.render('category',{loginStatus:loginStatus,category:allCategory,products:categoryProductsList,userId:UserData,categoryName:"All Category"})
    console.log("last");
  } catch (error) {
    console.log(error);
  }
}


//category home after logout
const homeCategoryLogout=async(req,res)=>{
  try {
    res.set("Cache-control","no-store")
    console.log("category logout")
    const allCategory=await Product.find({})
    const loginStatus=req.session.login_status=false
    console.log(loginStatus)
    res.render('category',{products:allCategory,loginStatus:loginStatus})
  } catch (error) {
    console.log(error)
  }
}



//product login
const eachProductLogin=async(req,res)=>{
  try {
    res.set("Cache-control","no-store")
      console.log("helkoo")
      // res.render('singleProduct')
      const loginStatus=req.session.login_status=true
      const productId=req.query.product
      const product=await Product.findOne({_id:productId})
      console.log(productId)
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
  }
}


//just testing route
const testing=async(req, res)=>{
  try {
    console.log("testing purpose")
    res.render('test')
  } catch (error) {
    console.log(error)
  }
}


const errorPage=async(req,res)=>{
  try {
    console.log("error page");
    res.render('error')
  } catch (error) {
    console.log(error)
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
  }
}

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
    res.render('userCart',{isLogin:isLogin,userId:UserData,cartItem:userCart})
  } catch (error) {
    console.log(error);
  }
}



//add to cart

const addToCart=async(req,res)=>{
  try {
    console.log("add to cart startedddd>>>>");
    const productId=new ObjectId(req.body.productId)
    const userId=new ObjectId(req.query.id)
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
          status:"Pending",
          couponValue:0
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
    await cartDetails.save();

    // Calculate total cart price
    
     

    await UserData.save();

    const data = [cartDetails,UserData];
    res.json(data);

  } catch (error) {
    console.log(error);
  }
}

//checkout

const checkout=async(req,res)=>{
  try {
    res.set("Cache-control","no-store")
    console.log("checkout starting>>>>>>>>>");
    const userId=req.session.user_id
    const isLogin=req.session.loginStatus
    const UserData=await User.findById({_id:userId})
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
 
    if(req.session.couponId)
    {
      applycouponData=new ObjectId(req.session.couponId)
      applycouponData=await Coupon.findById({_id:applycouponData})
      applycouponData.couponValue=req.session.couponValue

      await applycouponData.save()
      console.log("appliedCouponData is>>>>>>>>>>>>" ,applycouponData.couponId);
      
    }
    else
    {
      applycouponData=0
    }
    console.log("applycouponData is>>>>>>>>>>>>>>>>>>>>",applycouponData);
    res.render('checkout',{isLogin:isLogin,userId:UserData,cartItem:userCart,address:defaultAddress,allAddress:allAddress,couponData:couponData,applycouponData:applycouponData})
    
  } catch (error) {
    console.log(error);
  }
}


//applyCoupon
const applyCoupon=async(req,res)=>{
  try {
    console.log("applyCoupon started");
    const couponData=await Coupon.find({})
    console.log(couponData);
    res.json(couponData)
  } catch (error) {
    console.log(error);
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
    console.log(UserData);
    console.log("step 1");
    const userCart=await UserCart.findOne({userId:userId}).populate('productId')
    let totalValue=UserData.totalCart
    console.log(totalValue);
    let couponValue=applycouponData.discountValue
    console.log('step 1.1');
    // console.log(applycouponData);
    console.log(applycouponData.discountValue);
    console.log(couponValue);
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
    console.log(userCart);
    console.log(userCart.couponValue);
    console.log(couponValue);
    console.log(typeof(userCart.couponValue));
    console.log(typeof(couponValue));
    userCart.couponValue=couponValue
    await userCart.save()
    console.log("totalValue  is..",totalValue);
    UserData.totalCart=totalValue
    await UserData.save()
     

    const defaultAddressId=new ObjectId(UserData.deafultAddrss)
    
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
    req.session.couponId=applycouponData._id
    req.session.couponValue=couponValue
    console.log("coupn value is ",couponValue);
    const data=true
    res.json(data)
    

  } catch (error) {
    console.log(error);
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
  }
}

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
   

    const userId=new ObjectId(req.session.user_id)
    const userCart=await UserCart.find({userId:userId}).populate('productId')
    const userData=await User.findById({_id:userId})
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
      amount:userData.totalCart,
      orderStatus:"Order Pending",
      shippingDate:shippingDate,
      deliveryDate:deliveryDate,
      productStatus:productStatus
    })
    req.session.orderConfirmed=true
    req.session.checkout=false
    if(newOrder)
    {
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
  }
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


//Online payment route start
const onlinePayment=async(req,res)=>{
  try {
      console.log("onlinr payment us started");
      console.log("cash on delivery tart");
      res.set("Cache-control","no-store");
      const paymentMethod=req.body.paymentMethod
      console.log(paymentMethod);
      const userId=new ObjectId(req.session.user_id)
      const userData=await User.findById({_id:userId})
      const randomNumber = generateRandomNumber();
      const totalAmount=userData.totalCart
      const orderId=`HOC${randomNumber}`
      const razorpayOrderId= await generateRazorpay(totalAmount,orderId)
      console.log("razorpay order id",razorpayOrderId);
      if(razorpayOrderId)
      {
        console.log("success step 1");
        const data=[true,"onlinePayment",razorpayOrderId]
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
      console.log("req.session.orderId",req.session.orderId);
      const newOrder=new Order({
        orderId:order.receipt,
        userId:userData._id,
        payment:paymentMethod,
        deliveryAddress:userData.deafultAddrss,
        orderDate:currentDate.toDateString(),
        productItem:productIds,
        cartProducts:newOrderItemID,
        productPrice:productPrices,
        productQuantity:productQty,
        amount:userData.totalCart,
        orderStatus:"Order Pending",
        shippingDate:shippingDate,
        deliveryDate:deliveryDate,
        productStatus:productStatus
      })
      req.session.orderConfirmed=true
      req.session.checkout=false
      if(newOrder)
      {
        console.log("complted");
        await newOrder.save()
        userData.totalCart=0
        await userData.save()
        await UserCart.deleteMany({ userId: userId });
        console.log("deleted");
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
    }
}


//walletPayment
const walletPayment=async(req,res)=>{
  try {
    console.log("walletPayment started >>>>>>");


    res.set("Cache-control","no-store")
    const paymentMethod=req.body.paymentMethod
    console.log(paymentMethod);
   

    const userId=new ObjectId(req.session.user_id)
    const userCart=await UserCart.find({userId:userId}).populate('productId')
    const userData=await User.findById({_id:userId})

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
      console.log("req.session.orderId",req.session.orderId);
      const newOrder=new Order({
        orderId:orderId,
        userId:userData._id,
        payment:paymentMethod,
        deliveryAddress:userData.deafultAddrss,
        orderDate:currentDate.toDateString(),
        productItem:productIds,
        cartProducts:newOrderItemID,
        productPrice:productPrices,
        productQuantity:productQty,
        amount:userData.totalCart,
        orderStatus:"Order Pending",
        shippingDate:shippingDate,
        deliveryDate:deliveryDate,
        productStatus:productStatus
      })
      req.session.orderConfirmed=true
      req.session.checkout=false
      if(newOrder)
      {
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
  }
}


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
    console.log("oderAdress",orderDetails.deliveryAddress);
    const productDetails = await Promise.all(orderDetails.productItem.map(async (productId) => {
      const product = await Product.findById(productId);
      return product;
    }));
    console.log("product details>>>>",productDetails);
    res.render('orderConfirm',{isLogin:isLogin,userId:UserData,orderId:orderDetails.deliveryAddress,orderDetails:orderDetails,productDetails:productDetails})

  } catch (error) {
    console.log(error);
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
    const userOrder=await Order.find({userId:userId}).populate('deliveryAddress').populate('productItem').populate('cartProducts')
    console.log("order.......");
    
    console.log(userOrder);
 
   
    // console.log("user product",userOrder[2].productItem);
    res.render('userOrder',{isLogin:isLogin,userId:UserData,orderDetails:userOrder})
  } catch (error) {
    console.log(error);
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
        orderData.productStatus[i]="Cancelled"
   
        await orderData.save()
        console.log("final setup is",orderData);
        res.json(orderData)

      }

    }


  } catch (error) {
    
    console.log(error);
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
      returnStatus:"Return Initiated"
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
  }
}

const userAddress=async(req,res)=>{
  try {
    console.log("user address start");
    const userId=new ObjectId(req.session.user_id)
    const isLogin=req.session.loginStatus
    const UserData=await User.findById({_id:userId})
    console.log(userId)
    console.log(isLogin);
    const userAddress=await Address.find({userId:userId})
    console.log("loading user all address");
    console.log(userAddress);
    const userAddressCount=await Address.countDocuments({userId:userId})
    console.log(userAddressCount);
    res.render('userAddress',{isLogin:isLogin,userId:UserData,address:userAddress})
    
  } catch (error) {
    console.log(error);
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
    const addressDetails=await Address.findById({_id:addressId})
    console.log(addressDetails);
    console.log("edit  end");
    
    res.render('editAddress',{isLogin:isLogin,userId:UserData,address:addressDetails})
  } catch (error) {
    console.log(error);
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
    await Address.findByIdAndDelete({_id:addressId})
    const userAddress=await Address.find({userId:userId})
    const UserData=await User.findById({_id:userId})
    const isLogin=req.session.loginStatus
    console.log("delete address end");
    res.render('userAddress',{isLogin:isLogin,userId:UserData,address:userAddress})
  } catch (error) {
    console.log(error);
  }
}

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
  }
}

// const comparePassword=async(currentPassword,userPassword)=>{

//   try {
//     console.log("comapre password");
//     console.log(currentPassword);
//     console.log(userPassword);
//     const match=await bcrypt.compare(currentPassword,userPassword)
//     console.log("match",match);
//     return match
//   } catch (error) {
//     console.log(error);
//   }
// }

const currentPassword=async(req,res)=>{
  try {
    console.log("currentPassword started");
    const userId=req.query.id
    console.log("step 1");
    const receivedPassword=req.body.currentPassword

    const userData=await User.findById({_id:userId})
 
    const currentPassword=await bcrypt.compare(receivedPassword,userData.password)
    console.log(currentPassword);
    console.log("step 6");

    if(currentPassword)
    {
      const otp = otpGenerator.generate(4, {digits:true, upperCaseAlphabets: false, specialChars: false , lowerCaseAlphabets:false});

      const otpDB=new OTP({
        userId:userId,
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
    const otpData=await OTP.findOne({userId:UserId})
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
  }
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
  }
}



const userReferals=async(req,res)=>{
  try {
    console.log("user user coupons start");
    const userId=new ObjectId(req.session.user_id)
    const isLogin=req.session.loginStatus
    const UserData=await User.findById({_id:userId})
    console.log(userId)
    console.log(isLogin);
    res.render('userReferals',{isLogin:isLogin,userId:UserData})
  } catch (error) {
    console.log(error);
  }
}



module.exports = {
  securePassword,
  userLogin,
  userLogout,
  forgotPassword,
  forgotPasswordOtpVerification,
  forgotPasswordNewEmail,
  userVerify,
  userRegistration,
  verifyOtp,
  createUser,
  resendOTP,
  homePageLogin,
  homePageLogout,
  homeCategoryLogin,
  categoryList,
  searchCategory,
  productSearch,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  priceFilter,
  productRating,
  sorting,
  homeCategoryLogout,
  eachProductLogin,
  eachProductLogout,
  testing,

  userProfile,
  editUserProfile,

  userCart,
  addToCart,
  removeCart,
  cartQuantity,
  checkout,
  applyCoupon,
  addOnCoupon,
  removeCoupon,
  addressSelection,
  cashOnDelivery,
  onlinePayment,
  verifyPayment,
  walletPayment,
  orderConfirmed,
  userOrders,
  cancelOrder,
  cancelOrderItem,
  returnProduct,
  
  userWishlist,

  userAddress,
  loadAddAddress,
  uploadAddAddress,
  editAddress,
  updateEditAddress,
  deleteAddress,
  
  resetPassword,
  currentPassword,
  resetPasswordOtpVerification,
  resetNewPassword,
  userWallet,
  addWallet,
  verifyAddWallet,
  userReferals,
  errorPage
};
