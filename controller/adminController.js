const Admin=require('../model/adminModel')
const Products=require('../model/productModel')
const User=require('../model/userModel')
const Category=require('../model/category')
const Order=require('../model/orders')
const OrderItems=require('../model/orderItems')
const Address=require('../model/address')
const bcrypt=require('bcrypt')
//sweet alert
const Swal=require('sweetalert2')
// const io = require('socket.io')(server);
const io = require('../index'); 
const category = require('../model/category')
const Coupon=require('../model/coupons')
const DataTable = require( 'datatables.net' );
const moment = require('moment');
const mongoose = require('mongoose');
const session = require('express-session')
const Offer=require('../model/offer')
const ObjectId = mongoose.Types.ObjectId;

const securePassword = async (password) => {
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      return passwordHash;
    } catch (error) {
      console.log(error);
    }
  };

//admin login
const adminLogin=async(req,res)=>{
    try {
        res.set("Cache-control","no-store")
        console.log("admin login page")
        const loginError=req.session.loginError
        req.session.loginError=" "
        res.render('login',{loginError:loginError})
    } catch (error) {
        console.log(error)
    }
}

//amdin logout
const adminLogout=async(req,res)=>{
    try {
       
        console.log("logout 1")
        req.session.destroy()
        console.log("logout 2")
        res.redirect('/admin/login')
        console.log("logout ")
    } catch (error) {
        console.log(error)
    }
}

//admin validation
const adminValidation=async(req,res)=>{
    try {
        
        const email=req.body.email
        const password=req.body.password

        const adminData=await Admin.findOne({email:email})

    if(adminData)
    {
        const passwordMatch=await bcrypt.compare(password,adminData.password)
        console.log(password)
        console.log(adminData.password)
        console.log(passwordMatch)
        if(passwordMatch)
        {
            res.set("Cache-control","no-store")
            req.session.adminId=true
            res.redirect('/admin/dashboard')
        }
        else
        {
            req.session.loginError="Invalid Password"
            res.redirect('/admin/login')
        }
    }
    else
    {
        req.session.loginError="Invalid Email ID"
        res.redirect('/admin/login')
    }

        
    } catch (error) {
        console.log(error)
    }
}



//admin Dashboard
const adminDashboard=async(req,res)=>{
    try {
        res.set("Cache-control","no-store")
        res.render('dashboard')
    } catch (error) {
        console.log(error)
    }
}

//salesReport
const salesReport=async(req,res)=>{
    try {
        console.log("salesReport started/>>>>>>");
       
        
        let allOrders;
        if(req.session.salesData)
        {
            allOrders=req.session.salesData
            delete req.session.salesData
        }
        else
        {
             allOrders=await Order.find({}) 
        }
        console.log("all Orders is ",allOrders);
        const totalRevenue=await Order.aggregate([{$group:{_id:null,total:{$sum:"$amount"}}}])
        console.log("total revenu",totalRevenue);
        res.render('salesReport',{page:"main",allOrders:allOrders,totalRevenue:totalRevenue})
    } catch (error) {
        console.log(error);
    }
}


//salesDateFilter
const salesDateFilter=async(req,res)=>{
    try {
        console.log("salesDateFilter started >>>");
        const fromDate=req.body.fromDate
        const toDate=req.body.toDate
        console.log(fromDate);
        console.log(toDate);
        
        console.log("filtersssssssssss"); 
        const filterData=await Order.find({
            orderDate: {
                $gte:fromDate,
                $lte: toDate
            }
        })
        console.log("filter ???",filterData);
     
        req.session.salesData=filterData
        res.json(true)
          
    } catch (error) {
        console.log(error);
    }
}

//dailySalesReport
const dailySalesReport=async(req,res)=>{
    try {
        console.log("dailySalesReport started>>>>");  
        const allOrders=await Order.find({})
        console.log("allOrder is",allOrders);
            const salesData = await Order.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
                        totalAmount: { $sum: "$amount" }
                    }
                },
                {
                    $sort: { _id: 1 } 
                }
            ]);
            console.log("sales data",salesData);
            const dailySales = salesData.map(({ _id, totalAmount }) => ({
                date: _id,
                amount: totalAmount
            }));
            console.log("Daily sales report:", dailySales);
            const totalRevenue=await Order.aggregate([{$group:{_id:null,total:{$sum:"$amount"}}}])
            console.log("total revenu",totalRevenue);
            res.render('salesReport',{page:"daily", dailySales: dailySales ,totalRevenue:totalRevenue})
    } catch (error) {
        console.log(error);
    }
}

//weekly report
const weeklySalesReport = async (req, res) => {
    try {
        console.log("weekly SalesReport started>>>>");
        const today = new Date();
const startDate = new Date(today);
const endDate = new Date(today);
endDate.setDate(today.getDate() - 1); // Exclude today's sales
const fourteenDaysAgo = new Date(today); // Create a new date object with the current date
fourteenDaysAgo.setDate(today.getDate() - 14);
const weeklySalesData = [];

while (startDate > fourteenDaysAgo) {
    const weeklyStartDate = new Date(startDate);
    weeklyStartDate.setDate(startDate.getDate() - 6); // Get the start date of the week

    const salesData = await Order.aggregate([
        {
            $match: {
                orderDate: { $gte: weeklyStartDate, $lte: startDate }
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" }
            }
        }
    ]);

    const totalAmount = salesData.length > 0 ? salesData[0].totalAmount : 0;

    weeklySalesData.push({
        startDate: weeklyStartDate.toLocaleDateString('en-US'),
        endDate: startDate.toLocaleDateString('en-US'),
        totalAmount: totalAmount
    });

    // Move to the previous week
    startDate.setDate(startDate.getDate() - 7);
}

console.log("Weekly sales report:", weeklySalesData);


        

        const totalRevenue = await Order.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
        console.log("total revenue:", totalRevenue);

        res.render('salesReport', { page: "weekly", dailySales: weeklySalesData, totalRevenue: totalRevenue });
    } catch (error) {
        console.log(error);
    }
};

//monthlySalesReport
const monthlySalesReport = async (req, res) => {
    try {
        console.log("Monthly Sales Report started>>>>");
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1); // First day of current month
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthlySalesData = [];

        while (startDate >= startOfMonth) {
            const endDateOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

            const salesData = await Order.aggregate([
                {
                    $match: {
                        orderDate: { $gte: startDate, $lte: endDateOfMonth }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: "$amount" }
                    }
                }
            ]);

            const totalAmount = salesData.length > 0 ? salesData[0].totalAmount : 0;

            monthlySalesData.push({
                month: startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                totalAmount: totalAmount
            });

            // Move to the previous month
            startDate.setMonth(startDate.getMonth() - 1);
        }

        console.log("Monthly sales report:", monthlySalesData);

        const totalRevenue = await Order.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
        console.log("total revenue:", totalRevenue);

        res.render('salesReport', { page: "monthly", monthlySales: monthlySalesData, totalRevenue: totalRevenue });
    } catch (error) {
        console.log(error);
    }
};


//All orders
const allOrders=async(req,res)=>{
    try {
        console.log("all orders startting >>>>>>>>>******");
        res.set("Cache-control","no-store")
        const allOrders=await Order.find({}).populate('deliveryAddress')
        console.log(allOrders);
        console.log("address");
      
        res.render('allOrders',{allOrders:allOrders})
        
    } catch (error) {
        console.log(error)
    }
}
//orderStatusUpdate
const orderStatusUpdate=async(req,res)=>{
    try {
        console.log("status update ******************");
        const orderId=new ObjectId(req.body.orderId)
        const orderStatus=req.body.orderStatus
        console.log(orderId);
        console.log(orderStatus);
        const OrderData=await Order.findById({_id:orderId})
        if(OrderData)
        {
            console.log("order data found it>>");
            OrderData.orderStatus.unshift(orderStatus)
            await OrderData.save()
            const data=true
            res.json(data)
        }
        else
        {
            console.log("order data failed>>");
            const data=false
            res.json(data)
        }

    } catch (error) {
        console.log(error);
    }
}

//orderItems
const orderItems=async(req,res)=>{
    try {
        console.log("order item started.....");
        const orderId=new ObjectId(req.query.orderId)
        console.log(orderId);
        const orderData=await Order.findById({_id:orderId}).populate('productItem')
        console.log(orderData);
        res.render('orderItems',{orderData:orderData})
    } catch (error) {
        console.log(error);
    }
}

//cancel orer items
const orderItemCancel=async(req,res)=>{
    try {
        console.log("cancel product item started");
        const orderId=new ObjectId(req.body.orderId)
        const productId=new ObjectId(req.body.productId)
        console.log(orderId);
        console.log(productId);
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


//orderItemStatusUpdate

const orderItemStatusUpdate=async(req,res)=>{
    try {
        console.log("start product status changing");
        const orderId=new ObjectId(req.body.orderId)
        const productId=new ObjectId(req.body.productId)
        const orderStatus=req.body.orderStatus
        console.log(orderId);
        console.log(productId);
        console.log(orderStatus);
        const orderData=await Order.findById({_id:orderId}).populate('productItem')
        let value;
       for(let i=0;i<orderData.productItem.length;i++)
       {
        if(orderData.productItem[i].equals(productId))
        {
            orderData.productStatus[i]=orderStatus;
            break;
        }
       }
       await orderData.save();
       console.log("orderDtaa",orderData);
       res.json(orderData)
    } catch (error) {
        console.log(error);
    }
}

//all users
const allUsers=async(req,res)=>{
    try {
        res.set("Cache-control","no-store")
        const allUsers=await User.find({})
        res.render('allUsers',{users:allUsers})
    } catch (error) {
        console.log(error)
    }
}

//add user
const addUser=async(req,res)=>{
    try {
        res.set("Cache-control","no-store")
        console.log("add user starting")
        res.render('addUser')
    } catch (error) {
        console.log(error)
    }
}


//block user
const  blockUser = async (req, res) => {
    try {
        console.log("hii blockUser")
        console.log(req.params)
      const userId = req.params.userid;
      const isBlocked = req.body.isBlocked;
        console.log(userId)
        console.log(isBlocked)
       
      const updatedUser = await User.findByIdAndUpdate(
        { _id: userId },
        { $set: { isBlocked: isBlocked } }
      );
      let data;
      if(isBlocked===true)
      {
        console.log("true is blocked");
       req.session.isBlocked=true   
        data=true
      }
      else
      {
        console.log("false is unblocked");
        req.session.isBlocked=false  
         data=false
      }
       // Emit an event to the user's login page
        // io.emit('userBlocked', { userId, isBlocked});

        console.log(updatedUser)

      res.json(data);
    } catch (error) {
      console.error(error);
      
    }
  };

  //delete user
  const deleteUser=async(req,res)=>{
    try {

        console.log("user delete")
        const userId=req.query.id
        await User.findOneAndDelete({_id:userId})
        res.json(userId)
        
    } catch (error) {
        console.log(error)
    }
  }

//All category
const allCategory=async(req,res)=>{
    try {
        res.set("Cache-control","no-store")
        const allCategory=await Category.find({})
        console.log("all category route")
        res.render('allCategory',{category:allCategory})
    } catch (error) {
        console.log(error)
    }
}

//Add Category
const addCategory=async(req,res)=>{

    try {
        res.set("Cache-control","no-store")

        const categoryName=req.body.categoryName
        const categoryDescription=req.body.categoryDescription

        const category=new Category({
            
            categoryName:req.body.categoryName,
            categoryDescription:req.body.categoryDescription,
            isBlocked:false
        })
        const categoryData=await category.save()

        if(categoryData)
        {
            res.redirect('/admin/allCategory')
        }
        else
        {
            res.redirect('/admin/allCategory')
        }
    } catch (error) {
        console.log(error)
    }
}

//Edit Category
const editCategory=async(req,res)=>{
    try {
        console.log("category edit starte...")
        res.set("Cache-control","no-store")
        const categoryId=new Object(req.body.categoryId)
        const categoryName=req.body.categoryName
        const categoryDescription=req.body.categoryDescription
        console.log(categoryId)
        console.log(categoryName)
        console.log(categoryDescription)
        const CategoryData=await Category.findOne({_id:categoryId})
        const existingCategory=await Category.findOne({categoryName:categoryName})
        console.log(existingCategory)
        console.log(CategoryData)
        if(CategoryData)
        {
            if(existingCategory && existingCategory.categoryName===categoryName && (!CategoryData._id.equals(existingCategory._id)))
            {
                console.log("Already Existing Category")
                req.session.categoryError="Already Existing Category"
                // res.redirect('/admin/allCategory')
                const data=[false,"Already Existing Category"]
                res.json(data)
                
            }
            else
            {
                console.log(typeof(categoryDescription)==='undefined' );
                if( categoryDescription.length===0 || categoryName.length===0)
                {
                    console.log("Error! Empty Input");
                    req.session.categoryError="Error! Empty Input"
                    // res.redirect('/admin/allCategory')
                    const data=[false,"Error! Empty Input"]
                    res.json(data)
                }
                else
                {
                   
                    console.log("update successfully");
                    await Category.findByIdAndUpdate({_id:categoryId},{$set:{categoryName:req.body.categoryName, categoryDescription:req.body.categoryDescription}})
                    // res.redirect('/admin/allCategory')
                    const data=[true,"update successfully"]
                    res.json(data)
                }
                
            }
  
        }
        else
        {
            req.session.categoryError="Invalid Input"
            // res.redirect('/admin/allCategory')
            const data=[false,"Invalid Input"]
            res.json(data)
        }
        
        
    } catch (error) {
        console.log(error)
    }
}

//deleteCategory
const deleteCategory=async(req,res)=>{
    try {
        const categoryId=req.query.id
        console.log("category delete")
        console.log(categoryId)
        await Category.findOneAndDelete({_id:categoryId})
        res.json(categoryId)
    } catch (error) {
        console.log(error)
    }
}



//All offers
const allOffers=async(req,res)=>{
    try {
        res.set("Cache-control","no-store")
        const allOffers=await Offer.find({})
        console.log("all offers",allOffers);
        res.render('allOffers',{allOffers:allOffers})
    } catch (error) {
        console.log(error)
    }
}

//addOffer
const addOffer=async(req,res)=>{
    try {
        console.log("addOffer started>>>>>>>>");
        const offerName=req.body.offerName
        const offerType=req.body.OfferType
        const startDate=req.body.startDate
        const endDate=req.body.endDate
        const discountType=req.body.discountType
        const discountValue=Number(req.body.discountValue)
        const offerImage=req.file
        const offerDescription=req.body.offerDescription

        console.log(offerName);
        console.log(offerType);
        console.log(startDate);
        console.log(endDate);
        console.log(discountType);
        console.log(discountValue);
        console.log(offerImage);
        console.log(offerDescription);
        const image=offerImage.filename
        console.log("image is",image);
        const newOffer=new Offer({
            offerName:offerName,
            offerType:offerType,
            startDate:startDate,
            endDate:endDate,
            discountType:discountType,
            discountValue:discountValue,
            offerImage:image,
            offerDescription:offerDescription
        })

        await newOffer.save()
        console.log(newOffer);
        
        const data=true;
        res.json(data)

    } catch (error) {
        console.log(error);
    }
}

//deleteOffer
const deleteOffer=async(req,res)=>{
    try {
        console.log("deleteOffer ......");
        const offerId=new ObjectId(req.query.offerId)
        console.log(offerId);
        const offerData=await Offer.findOneAndDelete({_id:offerId})
        console.log("offer id",offerId);
        const data=true
        res.json(data)
    } catch (error) {
        console.log(error);
    }
}


//editOffer
const editOffer=async(req,res)=>{
    try {
        console.log("˘editOffer started>>>>>>>");
        const offerId=new ObjectId(req.query.offerId)
        console.log("offer Id",offerId);
        const offerData=await Offer.findById({_id:offerId})
        console.log("offerid", offerId);
        res.json(offerData)
    } catch (error) {
        console.log(error);
    }
}

//editUpadteOffer
const editUpadteOffer=async(req,res)=>{
    try {
        console.log("editUpadteOffer started>>>>>>");
        console.log(req.body);
        console.log(req.query);
        
        
        const offerId=new ObjectId(req.body.offerId)
        console.log("Offerid is >>",offerId);
        const offerName=req.body.offerName
        const offerType=req.body.offerType
        const startDate=req.body.startDate
        const endDate=req.body.endDate
        const discountType=req.body.discountType
        const discountValue=req.body.discountValue
        const offerDescription=req.body.offerDescription
        let offerData;
        if(req.file)
        {
            console.log("image is >>",req.file);
             offerData=await Offer.findByIdAndUpdate({_id:offerId},{$set:{offerName:offerName,offerType:offerType,startDate:startDate,endDate:endDate,discountType:discountType,discountValue:discountValue,offerDescription:offerDescription,offerImage:req.file.filename}})
        }
        else
        {
            console.log("no >>image");
             offerData=await Offer.findByIdAndUpdate({_id:offerId},{$set:{offerName:offerName,offerType:offerType,startDate:startDate,endDate:endDate,discountType:discountType,discountValue:discountValue,offerDescription:offerDescription}})
        }

        offerData.save()
        const data=true
        res.json(data)
    } catch (error) {
        console.log(error);
    }
}



//All coupons
const allCoupons=async(req,res)=>{
    try {
        res.set("Cache-control","no-store")
        const couponData=await Coupon.find({})
        console.log("couponData",couponData);

        res.render('allCoupons',{couponData:couponData})
    } catch (error) {
        console.log(error)
    }
}


//add coupons
const addCoupons=async(req,res)=>{
    try {
        console.log("coupons added starting");
        const couponId=req.body.couponID
        const description=req.body.couponDescription
        const userLimit=req.body.couponUserLimit
        const expiryDate=req.body.couponExpiryDate
        const discountType=req.body.couponDiscountType
        const discountValue=req.body.couponDiscountValue
        console.log("couponID is ",couponId);

        const newCoupon=new Coupon({
            couponId:couponId,
            couponDescription:description,
            userLimit:userLimit,
            expiryDate:expiryDate,
            startingDate:new Date(),
            discountType:discountType,
            discountValue:discountValue,
            userUsage:userLimit,
            isActivated:true
        })

        await newCoupon.save()
        console.log("newCoupon is >>",newCoupon);
        if(newCoupon)
        {
            const data=true
            res.json(data)
        } 
    } catch (error) {
        console.log(error);
    }
}

//removeCoupon
const removeCoupon=async(req,res)=>{
    try {
        console.log("removeCoupon is started.....");
        const couponId=new ObjectId(req.body.couponId)
        console.log(couponId);
        if(couponId)
        {
            const couponData=await Coupon.findOneAndDelete({_id:couponId})
            console.log(couponData);
            const data=true
            res.json(data)

        }
        
    } catch (error) {
        console.log(error);
    }
}


//All Banners
const allBanners=async(req,res)=>{
    try {
        res.set("Cache-control","no-store")
        res.render('allBanners')
    } catch (error) {
        console.log(error)
    }
}
 

//all products
const allProducts=async(req,res)=>{
    try {

        res.set("Cache-control","no-store")
       
        // const category=await Products.aggregate([
        //     {
        //         $lookup:{
        //             from:"categories",
        //             localField:"productCategory",
        //             foreignField:"_id",
        //             as:"category"
        //         }
        //     },
        //   {
        //     $unwind: "$category"

        //   },
            
        //       {
        //         $project: {
        //           _id:0,
        //           category:"$category.categoryName"

        //         }
        //       }
           
        // ])
        console.log("prodcuts details......");
       
        const allProducts=await Products.find({isDelete:false}).populate('productCategory')
        console.log(allProducts);
           
    //    console.log("the catgory is "+JSON.stringify(category));
      
        res.render('allProducts',{products:allProducts})
    } catch (error) {
        console.log(error)
    }
}

// Add prodcuts get
const loadAddProducts=async(req,res)=>{
    try {
        res.set("Cache-control","no-store")
        console.log("one")
        const allcategory=await Category.find({})
        console.log("two")
        console.log(req.session.productError)
        const productError=req.session.productError
        console.log(productError)
        req.session.productError=" "
        console.log("four")
        res.render('addProducts',{category:allcategory,productError:productError})
    } catch (error) {
        console.log(error)
    }
}

//random number generator
function generateRandomNumber() {
    // Generate a random number between 100000 and 999999
    return Math.floor(Math.random() * 900000) + 100000;
  }

//add products Post
const addProducts=async(req,res)=>{
    try {
        res.set("Cache-control","no-store")
        console.log('step 1')
        console.log(req.body.productName)
        console.log(req.body.productCategory)
        console.log(req.body.productQuantity)
        console.log(req.body.productPrice)
        console.log(req.files)

        console.log(req.body.productDescription)

        console.log('step ultra1')
        const productName=req.body.productName
        const productQuantity=req.body.productQuantity
        const productPrice=req.body.productPrice
        const productImage=req.files.filename
        const productDescription=req.body.productDescription
        const imageFiles = req.files.map(file => file.filename);
        const productCategory=req.body.productCategory
        console.log("category = "+productCategory);
        const categoryData=await Category.findOne({categoryName:productCategory})
        console.log("category data"+categoryData);
        console.log('Image File Names:', imageFiles);
        console.log('step ultr2')
        console.log(productDescription)
        const nameRegex=/^[^\S\t]+$/.test(productName);
        const descriptionRegex=/^[^\S\t]+$/.test(productDescription);
        console.log('step ultr3')
        if(nameRegex || descriptionRegex || productPrice.includes(" ")  || productQuantity.includes(" "))
        {
            console.log("invalid input")
            req.session.productError="Invalid Input"
            res.redirect('/admin/addProducts')
        }
        else
        {
            if(productQuantity>=0 && productPrice>=0)
            {
                console.log(imageFiles)
                const randomNumber = generateRandomNumber();
                const productIDNumber=`HPI${randomNumber}`
                if(imageFiles.length>0)
                {
         
                const product=new Products({
                    productIDNumber:productIDNumber,
                productName:req.body.productName,
                 productCategory:categoryData,
                 productPrice:req.body.productPrice,
                 productQuantity:req.body.productQuantity,
                 productDescription:req.body.productDescription,
                 productImage:imageFiles,
                 productIsBlocked:false,
                 isDelete:false,
                 isCategoryBlocked:false,
                 createdDate:Date.now(),
                 lastUpdated:Date.now(),
                 productRating:1
                })
                console.log('step 2')
                const productData=await product.save()
                console.log('step 3')
                if(productData)
                {
                    console.log('step 4')
                    res.redirect('/admin/allProducts')
                    
                }
            
                else
                {
                    console.log('step 5')
                    res.redirect('/admin/allProducts')
                    
                }
            }
            else
            {
                console.log("Image Need To Add")
                req.session.productError="Image Need To Add"
                res.redirect('/admin/addProducts')
            }

            }
            else
            {
                console.log(" Quantity/product < 0invalid input")
                req.session.productError="Invalid Quantity/ Price Input"
                res.redirect('/admin/addProducts')

            }
           
        }


      
    } catch (error) {
        console.log('step 6')
        console.log(error)
    }
}

// edit products get
const loadEditProducts=async(req,res)=>{
    try {
        res.set("Cache-control","no-store")
        console.log("one")
        const productID=req.query.id
        console.log("two")
        console.log(productID)
        const productData=await Products.findById({_id:productID}).populate('productCategory')
        console.log("three")
        console.log(productData);
        const allCategory=await Category.find({})
        console.log("four")
        const productEditError=req.session.productEditError
        console.log("five")
        req.session.productEditError=" "
        console.log("six")
        if(productData)
        {
            console.log("inner one")
            res.render('editProducts',{products:productData,category:allCategory,productEditError:productEditError})
        }
        else
        {
            console.log("inner two")
            res.redirect('/admin/allProducts')
        }
        console.log("last")
    } catch (error) {
        console.log(error)
    }
}

//edit products post
const editProducts=async(req,res)=>{
    try {
        res.set("Cache-control","no-store")
        console.log('step 1')
        console.log(req.files)
        console.log(req.files.length )
        console.log(req.body.productId)
        console.log(req.body.productName)
        console.log(req.body.productCategory)
        console.log(req.body.productQuantity)
        console.log(req.body.productPrice)
        console.log(req.body.productDescription)
       

        const productId=req.body.productId[0]
        const productName=req.body.productName
        const productCategoryName=req.body.productCategory
        const productCategory=await Category.findOne({categoryName:productCategoryName})
        const productPrice=req.body.productPrice
        const productQuantity=req.body.productQuantity
        const productDescription=req.body.productDescription
        const imageFiles = req.files.map(file => file.filename);

        console.log('Image File Names:', imageFiles);
        console.log(imageFiles[0])
        console.log(imageFiles[1])
        console.log(imageFiles[2])
        const lastUpdated=Date.now()

        console.log('step a')


        const productData=await Products.findOne({_id:productId})
        console.log('step b')
        const existingProduct=await Products.findOne({productName:productName})
        console.log('step c')
        console.log(productData._id)
        console.log('step d')
        console.log("existing product => ")
        console.log(!existingProduct._id.equals(productData._id))
        if(existingProduct && existingProduct.productName===productName   && (!existingProduct._id.equals(productData._id)) )
        {
            console.log("x")
            console.log(existingProduct._id)
            console.log("y")
            console.log(productData.productName)
            console.log("z")
            console.log(productId)
            req.session.productEditError="Already Existing Product"
          
            res.redirect(`/admin/editProducts?id=${productId}`)
        }
        else if(!existingProduct._id.equals(productData._id))
        {
            req.session.productEditError="Already Existing Product"
            res.redirect(`/admin/editProducts?id=${productId}`)

        }
        else
        {
                if(productData)
            {
                const nameRegex=/^[^\S\t]+$/.test(productName);
                const descriptionRegex=/^[^\S\t]+$/.test(productDescription);
                console.log('step ultr3')
                console.log(productDescription)
                if(nameRegex || descriptionRegex  || productDescription.length===0)
                {
                    console.log(" edit invalid input")
                    req.session.productEditError="Invalid Input"
                    const productEditError=req.session.productEditError
                    console.log(productEditError)
                    res.redirect(`/admin/editProducts?id=${productId}`)
    
                }
                else
                { 
                    
                    if(productPrice.length===0 || productQuantity.length===0)
                    {
                        req.session.productEditError="Should Not Be Empty"
                        res.redirect(`/admin/editProducts?id=${productId}`)

                    }
                    else
                    {
                        if(productQuantity>=0 && productPrice>=0)
                         {
                         
                            if ( req.files.length !== 0) {
                                console.log("succes1")
                                console.log(productCategory);
                                const productData = await Products.findByIdAndUpdate({_id:productId},{$set:{productName:productName,productCategory:productCategory,productPrice:productPrice,productQuantity:productQuantity,productDescription:productDescription,productImage:imageFiles,lastUpdated:lastUpdated}})
                                
                                res.redirect('/admin/allProducts')
                            }
                            else
                            {
                                console.log("succes2")
                                const productData =  await Products.findByIdAndUpdate({_id:productId},{$set:{productName:productName,productCategory:productCategory,productPrice:productPrice,productQuantity:productQuantity,productDescription:productDescription,lastUpdated:lastUpdated}})
                                res.redirect('/admin/allProducts')
                            }

                         }
                         else
                         {
                            req.session.productEditError="Should not be negative values"
                            res.redirect(`/admin/editProducts?id=${productId}`)

                         }
                     

                    }

                }
                    
            }
            else
            {
                        console.log(" invalid product")
                        req.session.productEditError="Invalid Input"
                        res.redirect(`/admin/editProducts?id=${productId}`)
    
            }

        }
       
        // const allProducts=await Products.find({})
        // res.render('allProducts',{products:allProducts})
       
       
       
    } catch (error) {
        console.log('step 6')
        console.log(error)
    }
}

//delete product(soft delete)
const deleteProduct=async(req,res)=>{
    try {
        res.set("Cache-control","no-store")
        console.log("delete page")
        const productId=req.query.id
        console.log(req.query.id)
        // await Products.deleteOne({_id:productId})
       await Products.findByIdAndUpdate({_id:productId},{$set:{isDelete:true}})
        res.json(productId)
        } catch (error) {
            console.log(error)
        }
        
}




module.exports={
    adminLogin,
    adminLogout,
    adminValidation,
    adminDashboard,
    salesReport,
    salesDateFilter,
    dailySalesReport,
    weeklySalesReport,
    monthlySalesReport,
    allOrders,
    orderStatusUpdate,
    orderItems,
    orderItemCancel,
    orderItemStatusUpdate,
    allUsers,
    addUser,
    blockUser,
    deleteUser,
    allProducts,
    loadAddProducts,
    addProducts,
    loadEditProducts,
    editProducts,
    deleteProduct,
    allCategory,
    addCategory,
    editCategory,
    deleteCategory,
    allOffers,
    addOffer,
    deleteOffer,
    editOffer,
    editUpadteOffer,
    allCoupons,
    addCoupons,
    removeCoupon,
    allBanners
}

