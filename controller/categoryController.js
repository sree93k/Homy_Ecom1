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
const Banner=require('../model/banner')
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
         allProducts=await Product.find({isDelete:false})
      }
  
          const page = parseInt(req.query.page) || 1;
          const limit = 9;
          const startIndex = (page - 1) * limit;
          const endIndex = page * limit;
          const products = allProducts.slice(startIndex, endIndex);
          const totalPages = Math.ceil(allProducts.length / limit);
  
      const loginStatus=req.session.login_status=true
      console.log(loginStatus)
      const allCategory=await Category.find({})
      console.log(allCategory);
      const userId=new ObjectId(req.session.user_id)
    
      const UserData=await User.findById({_id:userId})
      console.log(UserData)
  
      const userWish=await Wishlist.findOne({userId:userId})
      const allBanners=await Banner.find({})
      console.log("allBanners",allBanners);
      if(userWish)
      {
        console.log("userWishlist is >>>>>>",userWish);
        const userWishlist=userWish.productId
        console.log("?>>>",userWishlist);
        
        res.render('category',{products:products,loginStatus:loginStatus,category:allCategory,userId:UserData,categoryName:"All Category",userWishlist: JSON.stringify(userWishlist),page:page,totalPages:totalPages,data:null,allBanners:allBanners})
      }
      else
      {
        res.render('category',{products:products,loginStatus:loginStatus,category:allCategory,userId:UserData,categoryName:"All Category",userWishlist:null,page:page,totalPages:totalPages,data:null,allBanners:allBanners})
      }
  
    } catch (error) {
      console.log(error)
      res.render('errorPage')
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
      const page = parseInt(req.query.page) || 1;
          const limit = 9;
          const startIndex = (page - 1) * limit;
          const endIndex = page * limit;
          const products = categoryProductsList.slice(startIndex, endIndex);
          const totalPages = Math.ceil(categoryProductsList.length / limit);
          const allBanners=await Banner.find({})
          console.log("allBanners",allBanners);
      if(CategoryData.categoryName==="All Category")
      {
        res.redirect('/category')
      }
      else
      {
        res.render('category',{loginStatus:loginStatus,category:allCategory,products:products,userId:UserData,categoryName:CategoryData.categoryName,userWishlist: JSON.stringify(userWishlist),page:page,totalPages:totalPages,data:null,allBanners:allBanners})
        console.log("last");
  
      }
    } catch (error) {
      console.log(error)
      res.render('errorPage')
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
  console.log("resultsa ",results);
      res.json(results);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal server error' });
      res.render('errorPage')
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
      res.render('errorPage')
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
      res.render('errorPage')
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
      res.render('errorPage')
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
      res.render('errorPage')
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
      const userWishlist=await Wishlist.findOne({userId:userId})
      const allBanners=await Banner.find({})
    console.log("allBanners",allBanners);
      if(categoryName==="All Category")
      {
        console.log("alla caregory all prodciutsss");
        
         categoryProductsList=await Product.aggregate([{$match:{productPrice:{$gte:minPrice,$lte:maxPrice}}}])
        console.log("second");
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const products = categoryProductsList.slice(startIndex, endIndex);
        const totalPages = Math.ceil(categoryProductsList.length / limit);
        const data=[minPrice,maxPrice]

        res.render('category',{products:products,loginStatus:loginStatus,category:allCategory,userId:UserData,categoryName:"All Category",page:page,totalPages:totalPages,userWishlist:JSON.stringify(userWishlist),data:data,allBanners:allBanners})
  
      }
      else
      {
        console.log("price filter end");
         categoryProductsList=await Product.aggregate([{$match:{productCategory:categoryData._id,productPrice:{$gte:minPrice,$lte:maxPrice}}}])
         const page = parseInt(req.query.page) || 1;
          const limit = 9;
          const startIndex = (page - 1) * limit;
          const endIndex = page * limit;
          const products = categoryProductsList.slice(startIndex, endIndex);
          const totalPages = Math.ceil(categoryProductsList.length / limit);
        res.render('category',{loginStatus:loginStatus,category:allCategory,products:products,userId:UserData,categoryName:categoryName,page:page,totalPages:totalPages,userWishlist:JSON.stringify(userWishlist),data:data,allBanners:allBanners})
        console.log("last");
      }
  
  
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  }
  
  
  
  //user Rating
  const productRating=async(req,res)=>{
    try {
      console.log("product rating started");
      const productRating=req.body.productRate
      const categoryName=req.body.categoryName
      console.log("req.body.categoryName",req.body.categoryName);
      const userId=new ObjectId(req.session.user_id)
      console.log(productRating);
      console.log(categoryName);
      const loginStatus=req.session.login_status

      const categoryData=await Category.findOne({categoryName:categoryName})
      console.log("categoryData *********", categoryData);
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
      const userWishlist=await Wishlist.findOne({userId:userId})
      let categoryProductsList;
      const allBanners=await Banner.find({})
    console.log("allBanners",allBanners);
      if(categoryName==="All Category")
      {
        console.log("alla caregory all prodciutsss");
        //  categoryProductsList=await Product.aggregate([{$match:{productRating:{$gte:ratingValue}}}])
        const averageRatings = await Product.aggregate([
          {
              $project: {
                  productId: 1,
                  averageRating: { $avg: "$productRating.rating" }
              }
          },
          {
              $sort: { averageRating: -1 }
          },
          {
              $group: {
                  _id: null,
                  productIds: { $push: "$_id" },
                  averageRatings: { $push: "$averageRating" }
              }
          },
          {
              $project: {
                  _id: 0,
                  productIds: 1,
                  averageRatings: 1
              }
          }
      ]);
      console.log("Thee");
      console.log("the ratingvalue is ",ratingValue);
      console.log("averageRatings #####@@",averageRatings);
      let filteredProductIds = [];
      if (averageRatings.length > 0) {
          const ratings = averageRatings[0].averageRatings;
          const productIds = averageRatings[0].productIds;

          for (let i = 0; i < ratings.length; i++) {
              if (ratings[i] >= ratingValue) {
                  filteredProductIds.push(productIds[i]);
              }
          }
      }
      console.log("filteredProductIds is ",filteredProductIds);
        console.log("second");
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const products = filteredProductIds.slice(startIndex, endIndex);
        const totalPages = Math.ceil(filteredProductIds.length / limit);
      console.log("products is >>>",products);
      const productsDetails = await Product.aggregate([
        {
            $match: {
                _id: { $in: filteredProductIds }
            }
        },
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "productDetails"
            }
        },
        {
            $unwind: "$productDetails"
        },
        {
            $replaceRoot: { newRoot: "$productDetails" }
        }
    ]);
    
      console.log("totalPages >>>>>>>>",totalPages);
        res.render('category',{loginStatus:loginStatus,category:allCategory,products:productsDetails,userId:UserData,categoryName:"All Category",page:page,totalPages:totalPages,userWishlist:JSON.stringify(userWishlist),data:null,allBanners:allBanners})
  
      }
      else
      {
        console.log("price filter end");
        //  categoryProductsList=await Product.aggregate([{$match:{productCategory:categoryData._id,productRating:{$gte:ratingValue}}}])
        const averageRatings = await Product.aggregate([
          {
            $match: {
                productCategory: categoryData._id
            }
        },
          {
              $project: {
                  productId: 1,
                  averageRating: { $avg: "$productRating.rating" }
              }
          },
          {
              $sort: { averageRating: -1 }
          },
          {
              $group: {
                  _id: null,
                  productIds: { $push: "$_id" },
                  averageRatings: { $push: "$averageRating" }
              }
          },
          {
              $project: {
                  _id: 0,
                  productIds: 1,
                  averageRatings: 1
              }
          }
      ]);
      console.log("categoryData *********", categoryData);
      console.log("category data",categoryData._id);
      console.log("averageRatings is @@@second>>>",averageRatings);
      let filteredProductIds = [];
      if (averageRatings.length > 0) {
          const ratings = averageRatings[0].averageRatings;
          const productIds = averageRatings[0].productIds;

          for (let i = 0; i < ratings.length; i++) {
              if (ratings[i] >= ratingValue) {
                  filteredProductIds.push(productIds[i]);
              }
          }
      }
      console.log("filteredProductIds is ",filteredProductIds);
         const page = parseInt(req.query.page) || 1;
         const limit = 9;
          const startIndex = (page - 1) * limit;
          const endIndex = page * limit;
          const products = averageRatings.slice(startIndex, endIndex);
          const totalPages = Math.ceil(averageRatings.length / limit);
          const productsDetails = await Product.aggregate([
            {
                $match: {
                    _id: { $in: filteredProductIds }
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            {
                $unwind: "$productDetails"
            },
            {
                $replaceRoot: { newRoot: "$productDetails" }
            }
        ]);
        console.log("productsDetails",productsDetails);
        res.render('category',{loginStatus:loginStatus,category:allCategory,products:productsDetails,userId:UserData,categoryName:categoryName,page:page,totalPages:totalPages,userWishlist:JSON.stringify(userWishlist),data:null,allBanners:allBanners})
        console.log("last");
      }
      
    } catch (error) {
      console.log(error);
      res.render('errorPage')
    }
  
  }
  
  //sorting
  const sorting=async(req,res)=>{
    try {
      console.log("sorting starting");
      let sortingValue;
      let categoryName;
      if(req.query.catId)
      {
         categoryName=req.query.catId
         sortingValue=req.query.id
        req.session.catId=req.query.catId
        req.session.sortingValue=req.query.id
      }
      else
      {
        categoryName=req.session.catId
        sortingValue=req.session.sortingValue
      }
      
      console.log(sortingValue);
      console.log("cat id",categoryName);
     
      const loginStatus=req.session.login_status
      const allCategory=await Category.find({})
      const userId=new ObjectId(req.session.user_id)
      const UserData=await User.findById({_id:userId})
      let categoryData;
  
      const allBanners=await Banner.find({})
    console.log("allBanners",allBanners);
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
                                    // categoryProductsList=await Product.aggregate([{$sort:{productName:1}}])
                                    categoryProductsList = await Product.aggregate([
                                      {
                                        $project: {
                                          productName: { $toLower: "$productName" },
                                          _id:1,
                                          productIDNumber:1,
                                          productCategory:1,
                                          productPrice:1,
                                          productQuantity:1,
                                          productImage:1,
                                          productDescription:1,
                                          productIsBlocked:1,
                                          createdDate:1,
                                          lastUpdated:1,
                                          isCategoryBlocked:1,
                                          isDelete:1,
                                          productRating:1,
                                          productBrand:1
                                          
                                        }
                                      },
                                      {
                                        $sort: { productName: 1 }
                                      }
                                    ]);
                                    
                                    console.log(categoryProductsList);
                                    
                                    
                                  }
                                  else
                                  {
                                    categoryData=await Category.findOne({categoryName:categoryName})
                                    // categoryProductsList=await Product.aggregate([{$match:{productCategory:categoryData._id}},{$sort:{productName:1}}])
                                    categoryProductsList = await Product.aggregate([
                                      {
                                        $match:{productCategory:categoryData._id}
                                      },
                                      {
                                        $project: {
                                          productName: { $toLower: "$productName" },
                                          _id:1,
                                          productIDNumber:1,
                                          productCategory:1,
                                          productPrice:1,
                                          productQuantity:1,
                                          productImage:1,
                                          productDescription:1,
                                          productIsBlocked:1,
                                          createdDate:1,
                                          lastUpdated:1,
                                          isCategoryBlocked:1,
                                          isDelete:1,
                                          productRating:1,
                                          productBrand:1
                                          
                                        }
                                      },
                                      {
                                        $sort: { productName: 1 }
                                      }
                                    ]);
                                    
                                    console.log(categoryProductsList);
                                  }
                                break;
        case "Z - A":if(categoryName==="All Category")
                        {
                          // categoryProductsList=await Product.aggregate([{$sort:{productName:-1}}])
                          categoryProductsList = await Product.aggregate([
                            {
                              $project: {
                                productName: { $toLower: "$productName" },
                                _id:1,
                                productIDNumber:1,
                                productCategory:1,
                                productPrice:1,
                                productQuantity:1,
                                productImage:1,
                                productDescription:1,
                                productIsBlocked:1,
                                createdDate:1,
                                lastUpdated:1,
                                isCategoryBlocked:1,
                                isDelete:1,
                                productRating:1,
                                productBrand:1
                                
                              }
                            },
                            {
                              $sort: { productName: -1 }
                            }
                          ]);
                          
                          console.log(categoryProductsList);
                        }
                        else
                        {
                          categoryData=await Category.findOne({categoryName:categoryName})
                          // categoryProductsList=await Product.aggregate([{$match:{productCategory:categoryData._id}},{$sort:{productName:-1}}])
                          categoryProductsList = await Product.aggregate([
                            {
                              $match:{productCategory:categoryData._id}
                            },
                            {
                              $project: {
                                productName: { $toLower: "$productName" },
                                _id:1,
                                productIDNumber:1,
                                productCategory:1,
                                productPrice:1,
                                productQuantity:1,
                                productImage:1,
                                productDescription:1,
                                productIsBlocked:1,
                                createdDate:1,
                                lastUpdated:1,
                                isCategoryBlocked:1,
                                isDelete:1,
                                productRating:1,
                                productBrand:1
                                
                              }
                            },
                            {
                              $sort: { productName: -1 }
                            }
                          ]);
                          
                          console.log(categoryProductsList);
                        }
                      break;
        
      }
      console.log("category >>>",categoryProductsList);
      const userWishlist=await Wishlist.findOne({userId:userId})
      const page = parseInt(req.query.page) || 1;
         const limit = 9;
          const startIndex = (page - 1) * limit;
          const endIndex = page * limit;
          const products = categoryProductsList.slice(startIndex, endIndex);
          const totalPages = Math.ceil(categoryProductsList.length / limit);
  
      res.render('category',{loginStatus:loginStatus,category:allCategory,products:products,userId:UserData,categoryName:"All Category",page:page,totalPages:totalPages,userWishlist:JSON.stringify(userWishlist),data:null,allBanners:allBanners})
      console.log("last");
    } catch (error) {
      console.log(error);
      res.render('errorPage')
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
      const allBanners=await Banner.find({})
    console.log("allBanners",allBanners);
      res.render('category',{products:allCategory,loginStatus:loginStatus,allBanners:allBanners})
    } catch (error) {
      console.log(error)
      res.render('errorPage')
    }
  }

  module.exports={
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
  }