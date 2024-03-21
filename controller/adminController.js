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
const Banner=require('../model/banner')
const Return=require('../model/return')
const { use } = require('../routes/userRoute')
const Razorpay=require('razorpay')
const ObjectId = mongoose.Types.ObjectId;
const { createHash, createHmac } = require("crypto");
const crypto = require('crypto');
const { log } = require('console')
const Wallet=require('../model/wallet')
const Payment=require('../model/paymentDetails')
const path=require('path')
const { stat } = require('fs')
const fs=require('fs').promises

async function computeHmac()
{

const hmac=crypto.createHmac('sha256',process.env.KEY_SECRET)
return hmac
}


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
        res.render('errorPage',{error:error})
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
        res.render('errorPage',{error:error})
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
        res.render('errorPage',{error:error})
    }
}



//admin Dashboard
const adminDashboard=async(req,res)=>{
    try {
        res.set("Cache-control","no-store")
        const totalUser=await User.countDocuments({})
        console.log("total users >>>",totalUser);
        const totalOrders=await Order.countDocuments({})
        console.log("total orders ",totalOrders);
        const totalRevenue = await Order.aggregate([
            {
              $group: {
                _id: null, 
                totalAmount: { $sum: '$amount' } 
              }
            }
          ]);
          console.log("totoal revenue",totalRevenue);
          const totalProducts=await Products.countDocuments({})
          console.log("total products ",totalProducts);


        //   start
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        console.log("srtar year",startOfYear);
        
        const monthlyOrderData = await Order.aggregate([
            { $match: { orderDate: { $gte: startOfYear } } },
            { $match: { "orderStatus":  "Delivered"  } },
            {
                $group: {
                    _id: {
                        orderId: "$_id",
                        month: { $month: "$orderDate" },
                        year: { $year: "$orderDate" }
                    },
                    orderAmount: { $first: "$amount" },
                    couponDiscount: { $first: "$coupon" }
                }
            },
            {
                $group: {
                    _id: {
                        month: "$_id.month",
                        year: "$_id.year"
                    },
                    monthlyTotal: { $sum: "$orderAmount" },
                    monthlyCouponDiscount: { $sum: "$couponDiscount" },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ])

        let OrderCounts = new Array(12).fill(0);
        let TotalAmounts = new Array(12).fill(0);
        let CouponDiscounts = new Array(12).fill(0);

        monthlyOrderData.forEach(data => {
            const monthIndex = data._id.month - 1;
            OrderCounts[monthIndex] = data.orderCount;
            TotalAmounts[monthIndex] = data.monthlyTotal;
            CouponDiscounts[monthIndex] = data.monthlyCouponDiscount;
        });

        console.log("monthy order Data",monthlyOrderData);
        res.render('dashboard',{totalUser:totalUser,totalOrders:totalOrders,
                                totalProducts:totalProducts,totalRevenue:totalRevenue,
                                TotalAmount: TotalAmounts.reduce((acc, curr) => acc + curr, 0),
                                TotalAmounts,
                                TotalOrderCount: OrderCounts.reduce((acc, curr) => acc + curr, 0),
                                OrderCounts,
                                TotalCouponDiscount: CouponDiscounts.reduce((acc, curr) => acc + curr, 0),
                                CouponDiscounts,
                                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                                text: "Monthly",
                                activePage: 'dashboard'})
    } catch (error) {
        console.log(error)
        res.render('errorPage',{error:error})
    }
}

// yearlyChart
const yearlyChart=async(req,res)=>{
    try {
        console.log("yearlyChart  started >###$@@@@@@@@");
        res.set("Cache-control","no-store")
        const totalUser=await User.countDocuments({})
        console.log("total users >>>",totalUser);
        const totalOrders=await Order.countDocuments({})
        console.log("total orders ",totalOrders);
        const totalRevenue = await Order.aggregate([
            {
              $group: {
                _id: null, 
                totalAmount: { $sum: '$amount' } 
              }
            }
          ]);
          console.log("totoal revenue",totalRevenue);
          const totalProducts=await Products.countDocuments({})
          console.log("total products ",totalProducts);


        const tenYearsAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 10));

        const yearlyOrderData = await Order.aggregate([
            { $match: { orderDate: { $gte: tenYearsAgo } } },
            { $unwind: "$orderedItem" },
            { $match: { "orderedItem.productStatus": "Delivered"} },
            {
                $group: {
                    _id: {
                        orderId: "$_id",
                        year: { $year: "$orderDate" }
                    },

                    orderAmount: { $first: "$amount" },
                    couponDiscount: { $first: "$coupon" }

                }
            },
            {
                $group: {
                    _id: {
                        year: "$_id.year"
                    },
                    yearlyTotal: { $sum: "$orderAmount" },
                    yearlyCouponDiscount: { $sum: "$couponDiscount" },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1 } }
        ]);

        let orderCounts = new Array(6).fill(0);
        let totalAmounts = new Array(6).fill(0);
        let couponDiscounts = new Array(6).fill(0);
        let years = [];


        const currentYear = new Date().getFullYear();


        for (let i = 6; i >= 0; i--) {
            years.push(currentYear - i);
        }


        yearlyOrderData.forEach(data => {
            const yearIndex = years.indexOf(data._id.year);
            if (yearIndex !== -1) {
                orderCounts[yearIndex] = data.orderCount;
                totalAmounts[yearIndex] = data.yearlyTotal;
                couponDiscounts[yearIndex] = data.yearlyCouponDiscount;
            }
        });
        console.log('yearlyOrderData is ',yearlyOrderData);
        

        res.render("dashboard", {
            totalUser:totalUser,totalOrders:totalOrders,
            totalProducts:totalProducts,totalRevenue:totalRevenue,
            TotalAmount: yearlyOrderData.reduce((acc, curr) => acc + curr.yearlyTotal, 0),
            TotalCouponDiscount: yearlyOrderData.reduce((acc, curr) => acc + curr.yearlyCouponDiscount, 0),
            TotalOrderCount: yearlyOrderData.reduce((acc, curr) => acc + curr.orderCount, 0),
            OrderCounts: orderCounts,
            TotalAmounts: totalAmounts,
            CouponDiscounts: couponDiscounts,
            categories: years,
            text: 'Yearly',
            activePage: 'dashboard'
        });

    } catch (error) {
        console.log(error);
        res.render('errorPage',{error:error})
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
        res.render('errorPage',{error:error})
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
        res.render('errorPage',{error:error})
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
        res.render('errorPage',{error:error})
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
        res.render('errorPage',{error:error})
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
        res.render('errorPage',{error:error})
    }
};


// bestSellingProduct

const bestSellingProduct = async (req, res) => {
    try {

        const bestSellingProducts = await Order.aggregate([
            {
              $unwind: "$orderedItem"
            },
            {
              $match: {
                "orderedItem.productStatus": "Delivered" 
              }
            },
            {
              $lookup: {
                from: 'products', 
                localField: 'orderedItem.productId',
                foreignField: '_id',
                as: 'productDetails'
              }
            },
            {
              $unwind: "$productDetails"
            },
            {
              $group: {
                _id: {
                  productId: "$productDetails.productName"
                },
                totalSales: { $sum: { $multiply: ["$orderedItem.quantity", "$orderedItem.totalProductAmount"] } }
              }
            },
            {
              $sort: { totalSales: -1 }
            },
            {
              $limit: 10 
            },
            {
              $project: {
                _id: 0,
                productId: "$_id.productId",
                productName: "$productDetails.productName",
                totalSales: 1
              }
            }
          ]);
          
       console.log("bestSellingProducts 2222@@@@@@",bestSellingProducts);
 
        res.status(200).json({bestSellingProducts,item:'Product'})
      

    } catch (error) {

        console.log("error in best selling product",error)
        res.render('errorPage',{error:error})


    }
}



// bestSellingBrands
const bestSellingBrands=async(req,res)=>{
    try {
        console.log("best bestSellingBrands started@@@@>>>>>>>>>>>>");
        const bestSellingBrands = await Order.aggregate([
            {
              $unwind: "$orderedItem"
            },
            {
              $match: {
                "orderedItem.productStatus": "Delivered" 
              }
            },
            {
              $lookup: {
                from: 'products', 
                localField: 'orderedItem.productId',
                foreignField: '_id',
                as: 'productDetails'
              }
            },
            {
              $unwind: "$productDetails"
            },
            {
              $group: {
                _id: {
                  brand: "$productDetails.productBrand"
                },
                totalSales: { $sum: { $multiply: ["$orderedItem.quantity", "$orderedItem.totalProductAmount"] } }
              }
            },
            {
              $sort: { totalSales: -1 }
            },
            {
              $limit: 10 
            },
            {
              $project: {
                _id: 0,
                brand: "$_id.brand",
                totalSales: 1
              }
            }

          ])
           console.log("bestSellingBrands",bestSellingBrands);
           res.json({bestSellingBrands,item:'Brand'})

           console.log("best bestSellingBrands ended>@@@@>>>>>>>>>>>>");
    } catch (error) {
        console.log("error in best selling brand",error);
        res.render('errorPage',{error:error})
    }
}

// bestSellingCategir=o

const bestSellingCategories=async(req,res)=>{
    try {
        console.log("bestSellingCategories started @@@@>>>>>>");
        const bestSellingCategories = await Order.aggregate([
            {
              $unwind: "$orderedItem"
            },
            {
              $match: {
                "orderedItem.productStatus": "Delivered" 
              }
            },
            {
              $lookup: {
                from: 'products', 
                localField: 'orderedItem.productId',
                foreignField: '_id',
                as: 'productDetails'
              }
            },
            {
              $unwind: "$productDetails"
            },
            {
              $lookup: {
                from: 'categories',
                localField: 'productDetails.productCategory',
                foreignField: '_id',
                as: 'categorydetails'
              }
            },
            {
              $unwind: "$categorydetails"
            },
            {
              $group: {
                _id: {
                  category: "$categorydetails._id",
                  categoryName: "$categorydetails.categoryName"
                },
                totalSales: { $sum: { $multiply: ["$orderedItem.quantity", "$orderedItem.totalProductAmount"] } }
              }
            },
            {
              $sort: { totalSales: -1 }
            },
            {
              $limit: 10 
            },
            {
                $project: {
                  _id: 0,
             
                  categoryName: "$_id.categoryName",
                  totalSales: 1
                }
              }
          ]);
            console.log("bestSellingCategories",bestSellingCategories);
            res.status(200).json({bestSellingCategories,item:"Category"})
        
    } catch (error) {
        console.log('error in best selling category');
        res.render('errorPage',{error:error})
        
    }
}



// 
const PAGE_SIZE = 7; // Number of orders per page

const allOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Get the requested page number from the query parameters
        const skip = (page - 1) * PAGE_SIZE; // Calculate the number of orders to skip

        // Query to fetch orders for the requested page
        const orders = await Order.find({})
            .sort({createdAt:-1})
            .skip(skip)
            .limit(PAGE_SIZE)
            .populate('deliveryAddress');

        // Count total orders for pagination
        const totalOrders = await Order.countDocuments();
        console.log("orders >>>",orders);
        // Calculate total pages
        const totalPages = Math.ceil(totalOrders / PAGE_SIZE);

        res.render('allOrders', { allOrders: orders, currentPage: page, totalPages: totalPages });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
        res.render('errorPage',{error:error})
    }
};


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
            OrderData.orderStatus=orderStatus
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
        res.render('errorPage',{error:error})
    }
}


 async function UpdateOrderStatus(orderId){    
    try {
        console.log("funtion startedddd>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
        console.log(orderId);
        const OrderData= Order.findById({_id:orderId})
        const orderData = await Order.findById({_id: orderId});
       
            console.log("order data found it>>");
            if (orderData.productStatus.every(status => status === "Delivered" )) {
              
                     orderData.orderStatus="Delivered"     
            }
             else if(orderData.productStatus.every(status => status === "Pending" || status === "Dispatched" || status==="Shipped"))
             {
                orderData.orderStatus="Pending"   
            }
             else if(orderData.productStatus.every(status=>status==="Cancelled"))
            {
                orderData.orderStatus="Cancelled"   
            }
        await orderData.save();
        console.log("funtion endddddd>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    } catch (error) {
        console.error("Error:", error);
        res.render('errorPage',{error:error})
      
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
        res.render('errorPage',{error:error})
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
            UpdateOrderStatus(orderId)
            console.log("final setup is",orderData);
            res.json(orderData)
    
          }
    
        }
        
    } catch (error) {
        console.log(error);
        res.render('errorPage',{error:error})
    }
}


//orderItemStatusUpdate

const orderItemStatusUpdate=async(req,res)=>{
    try {
        console.log("start product status changing starteddd >>>>>");
        console.log(req.body.orderId);
        console.log(req.body.productId);
        console.log(req.body.orderStatus);
        console.log("starting from here");
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

            orderData.orderedItem[i].productStatus=orderStatus
            break;
        }
       }
       
       

       await orderData.save();
       console.log("orderDtaa",orderData);
       UpdateOrderStatus(orderId)
       res.json(orderData)
    } catch (error) {
        console.log(error);
        res.render('errorPage',{error:error})
    }
}


//returnStatusUpdate
const returnStatusUpdate=async(req,res)=>{
    try {
        console.log("returnStatusUpdate started >>>>");
        const returnStatus=req.body.returnStatus
        const orderId=new ObjectId(req.body.orderId)
        const productId=new ObjectId(req.body.productId)
        console.log("return status",returnStatus);
        console.log("order Id",orderId);
        console.log("product Id",productId);
        const orderData=await Order.findById({_id:orderId})
        const userId=orderData.userId
        console.log("user Id is ",userId);
        const returnData=await Return.findOne({orderId:orderId,productId:productId})
        const userData=await User.findById({_id:userId})
     
        returnData.returnStatus=returnStatus
        await returnData.save()
        const orderLength=orderData.productItem.length
        console.log("orderLength : ",orderLength);
        for(let i=0;i<orderLength;i++)
         {
            if(orderData.productItem[i].equals(productId))
            {
                orderData.productStatus[i]=returnStatus
                console.log("order 1",orderData.productStatus[i]);
                console.log("order 2",returnStatus);
                await orderData.save()
            }
        }   

        const allReturned = orderData.productStatus.every(status => status === "Return Arrived Warehouse");

        if (allReturned) {

            console.log("All products are cancelled.");
            orderData.orderStatus="Returned"
        } else {
            console.log("Some products are not cancelled.");
        }
            await orderData.save()
        const data=true
        console.log("yess iam complte");
        console.log("return data",returnData);
        console.log("user data",userData);
        console.log("order data",orderData);
        res.json(data)
    } catch (error) {
        console.log(error);
        res.render('errorPage',{error:error})
    }
}

function generateRandomNumber() {
    // Generate a random number between 100000 and 999999
    return Math.floor(Math.random() * 900000) + 100000;
  }
  
  function generateRazorpay(amount, orderID,orderId,prodcuctId) {
    return new Promise((resolve, reject) => {
      console.log("razorpay function awakened! GOOD MORNING!>>>>>>>>>");
      var instance = new Razorpay({
        key_id: process.env.KEY_ID,
        key_secret: process.env.KEY_SECRET,
      });
  
      var options = {
        amount: amount*100,
        currency: "INR",
        receipt: orderID,
        notes:{
            orderId:orderId,
            prodcuctId:prodcuctId
        }
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

// refundWallet
const refundWallet=async(req,res)=>{
    try {
        console.log("refundWallet started>>>>");
        const orderId=new ObjectId(req.body.orderId)
        const productId=new ObjectId(req.body.productId)
        const orderStatus=req.body.orderStatus
        console.log("order Id",orderId);
        console.log("prodcut Id",productId);
        console.log("order status",orderStatus);
        const orderData=await Order.findOne({_id:orderId})
        console.log("order data",orderData);
        const orderLength=orderData.productItem.length
        console.log("orderLength : ",orderLength);
        let refundAmount;
        for(let i=0;i<orderLength;i++)
         {
            console.log("yes ",i);
            console.log("one",orderData.productItem[i]);
            console.log("two ",productId);
            if(orderData.productItem[i].equals(productId))
            {
                console.log("amount entered");
                refundAmount=orderData.productPrice[i]*orderData.productQuantity[i]
                console.log("nos nios");
            }
            
                console.log("coupon Amount",orderData.coupon);
                refundAmount=refundAmount-orderData.coupon
                orderData.coupon=0
                await orderData.save()
            
            console.log("st nos nos");
        }  
        console.log("refund Amount is",refundAmount);
        const randomNumber = generateRandomNumber();
        const orderID=`REFUND${randomNumber}`
        const razorpayOrderId= await generateRazorpay(refundAmount,orderID,orderId,productId)
        console.log("ANy new yes");
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
        res.render('errorPage',{error:error})
    }
}

//verifyRefundPayment
const verifyRefundPayment=async(req,res)=>{
    try {
        console.log("verifyRefundPayment >>>>>");
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
      const paymentMethod="WalletPayment"
      console.log(paymentMethod);
        const orderId=order.notes.orderId
        const productId=order.notes.prodcuctId
        console.log("order Id",orderId);
        console.log("product Id",productId);
        const orderData=await Order.findById({_id:orderId})
        console.log("order Data is",orderData);
        const userId=orderData.userId
        console.log("userId",userId);
        const userWallet=await Wallet.findOne({userId:userId})
        console.log("userWallet is",userWallet);
        const refundAmount=order.amount/100;
        console.log("refund Amount is",refundAmount);
        const orderLength=orderData.productItem.length
        console.log("orderLength : ",orderLength);
        
        for(let i=0;i<orderLength;i++)
         {
            console.log("yes ",i);
            console.log("log 1",orderData.productItem[i]);
            console.log("log 2,",productId);
            if(orderData.productItem[i].equals(productId))
            {
                console.log("refund entered")
                
                orderData.amount=orderData.amount-refundAmount
                if(orderData.productStatus[i]==="Cancelled")
                {
                    orderData.productStatus[i]="Cancelled"
                    const allCancelled = orderData.productStatus.every(status => status === "Cancelled");

                    if (allCancelled) {
                        orderData.orderStatus="Cancelled"
                        console.log("All products are cancelled.");
                    } else {
                        console.log("Some products are not cancelled.");
                    }
                }
                else
                {
                    orderData.productStatus[i]="Return Completed"
                    const allReturned = orderData.productStatus.every(status => status === "Return Completed");

                    if (allReturned) {
                        orderData.orderStatus="Cancelled"
                        console.log("All products are cancelled");
                    } else {
                        console.log("Some products are not cancelled.");
                    }
                }
                
                await orderData.save()

                const paymentData=new Payment({
                    paymentMethod:"walletPayment",
                    paymentAmount:refundAmount,
                    paymentId:payment.razorpay_payment_id,
                    orderId:payment.razorpay_order_id,
                    signature:payment.razorpay_signature,
                    userId:userId,
                    paymentTime:new Date()
                  })
                  await paymentData.save()
                  const returnData=await Return.findOne({orderId:orderId,productId:productId})
                  if(returnData)
                  {
                    console.log("the retrun data",returnData);
                    returnData.returnStatus="Return Completed"
                    returnData.save()
                    console.log("the new retrun data",returnData);
                  }
                
              
                userWallet.balance=refundAmount
                const newTransaction={
                    amount:refundAmount,
                    type:"credit",
                    date:new Date()
                  }
                  userWallet.transaction.unshift(newTransaction)
                  await userWallet.save()
                  const data=[true,"onlinePayment"]
                  res.json(data)
            }
        }  


    }    
    } catch (error) {
        console.log(error);
        res.render('errorPage',{error:error})
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
        res.render('errorPage',{error:error})
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
        res.render('errorPage',{error:error})
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
      res.render('errorPage',{error:error})
      
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
        res.render('errorPage',{error:error})
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
        res.render('errorPage',{error:error})
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
        res.render('errorPage',{error:error})
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
        res.render('errorPage',{error:error})
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
        res.render('errorPage',{error:error})
    }
}


//All offers
const allOffers=async(req,res)=>{
    try {
        res.set("Cache-control","no-store")
        const allOffers=await Offer.find({})
        console.log("all offers",allOffers);
        const allProducts=await Products.find({})
        const allCategory=await Category.find({})
        res.render('allOffers',{allOffers:allOffers,allProducts:allProducts,allCategory:allCategory})
    } catch (error) {
        console.log(error)
        res.render('errorPage',{error:error})
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
        const checkedIds=req.body.checkedIds

        console.log("checkedIds >>",checkedIds);
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
        const offerData=await Offer.findOne({offerName:offerName})
        let allProducts;
        console.log("step ss11");
        console.log("checked Ids",checkedIds);
        console.log("checked Ids",typeof(checkedIds));
        let objectIdArray;

        if (typeof checkedIds === 'string') {
            objectIdArray = checkedIds.split(',');
            objectIdArray = objectIdArray.map(id => id.trim());
            objectIdArray = objectIdArray.map(id => new ObjectId(id));
        } else {
            console.error('checkedIds is not a string:', checkedIds);
        }

        console.log("step a");
        if(offerType==="Product Offer")
        {
            console.log("step b");
            if(discountType==="Discount Percentage")
            {
                console.log("step 01");
            }
            else
            {

                console.log("step 1");
                 allProducts=await Products.find({ _id: { $in: objectIdArray } })
                //  await Products.updateMany({ _id: { $in: objectIdArray } }, { $set: { productOffer: { offerId: offerData._id, offerType,discountType, discountValue } } });
                // Loop through each product in allProducts
               

            } 
        }
        else if(offerType==="Category Offer")
        {
            if(discountType==="Discount Percentage")
            {
                console.log("step 02");
            }
            else
            {
                console.log("step 2");
                 allProducts=await Products.find({ productCategory: { $in: objectIdArray } })
                //  await Products.updateMany({ productCategory: { $in: objectIdArray } }, { $set: { productOffer: { offerId: offerData._id, offerType,discountType, discountValue } } });

            } 
        }
        for (const product of allProducts) {
            const totalAmount = product.productPrice
            product.productPrice=totalAmount - discountValue;
            product.productOffer = {
                offerId: offerData._id,
                discountAmount:discountValue,
                totalAmount: totalAmount,
                discountType: discountType, 
                offerType: offerType 
            };

            await product.save();
        }
        console.log("all Products @#$@@@@",allProducts);
        const data=true;
        res.json(data)

    } catch (error) {
        console.log(error);
        res.render('errorPage',{error:error})
    }
}

//deleteOffer
const deleteOffer=async(req,res)=>{
    try {
        console.log("deleteOffer ......");
        const offerId=new ObjectId(req.query.offerId)
        console.log(offerId);
        const allProducts = await Products.find({ 'productOffer.offerId': offerId });

        console.log("all products !@#>>>",allProducts);

        for (const product of allProducts) {
            
            product.productPrice=product.productOffer.totalAmount
            await Products.updateOne({ _id: product._id }, { $unset: { productOffer: "" } });
            await product.save();
        }
        const offerData=await Offer.findOneAndDelete({_id:offerId})
        console.log("offer id",offerId);
        const data=true
        res.json(data)
    } catch (error) {
        console.log(error);
        res.render('errorPage',{error:error})
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
        res.render('errorPage',{error:error})
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
        res.render('errorPage',{error:error})
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
        res.render('errorPage',{error:error})
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
        res.render('errorPage',{error:error})
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
        res.render('errorPage',{error:error})
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
        res.render('errorPage',{error:error})
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
        res.render('errorPage',{error:error})
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
        const brandName=req.body.brandName
        console.log("category = "+productCategory);
        const categoryData=await Category.findOne({categoryName:productCategory})
        console.log("category data"+categoryData);
        console.log('Image File Names:', imageFiles);
        console.log('step ultr2')
        console.log(productDescription)
        const nameRegex=/^[^\S\t]+$/.test(productName);
        const brandRegex=/^[^\S\t]+$/.test(brandName);
        const descriptionRegex=/^[^\S\t]+$/.test(productDescription);
        console.log('step ultr3')
        if(nameRegex || brandRegex || descriptionRegex || productPrice.includes(" ")  || productQuantity.includes(" "))
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
                    const reviewData={
                        rating:[],
                        userName:[],
                        review:[]
                      }
         
                const product=new Products({
                productIDNumber:productIDNumber,
                productName:req.body.productName,
                productBrand:brandName,
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
                 productRating:reviewData
                })
                console.log('step 2')
                const productData=await product.save()
                console.log('step 3')
                if(productData)
                {
                    console.log('step 4')
                    const data=true
                    res.json(data)
                    
                }
            
                else
                {
                    console.log('step 5')
                    
                    const data=false
                    res.json(data)
                }
            }
            else
            {
                console.log("Image Need To Add")
                req.session.productError="Image Need To Add"
                const data=false
                res.json(data)
            }
            }
            else
            {
                console.log(" Quantity/product < 0invalid input")
                req.session.productError="Invalid Quantity/ Price Input"
                const data=false
                res.json(data)
            }     
        }
    } catch (error) {
        console.log('step 6')
       
        res.json(false)
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
        res.render('errorPage',{error:error})
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
       console.log("oldimageUrl is : ",req.body.oldimageUrl);

        const productId=req.body.productId
        const productName=req.body.productName
        const productBrand=req.body.productBrand
        const productCategoryName=req.body.productCategory
        const productCategory=await Category.findOne({categoryName:productCategoryName})
        const productPrice=req.body.productPrice
        const productQuantity=req.body.productQuantity
        const productDescription=req.body.productDescription
        const imageFiles = req.files.map(file => file.filename);
        const oldimageUrl=req.body.oldimageUrl

        console.log('Image File Names:', imageFiles);
        console.log(imageFiles[0])
        console.log(imageFiles[1])
        console.log(imageFiles[2])
        const lastUpdated=Date.now()

        console.log('step a')


        const productData=await Products.findOne({_id:productId})
        let ImageArray=productData.productImage
        if (oldimageUrl && oldimageUrl.length) {
            const oldImagesToRemove = JSON.parse(oldimageUrl);
            ImageArray = ImageArray.filter(item => !oldImagesToRemove.includes(item));

        }
        ImageArray.push(...imageFiles)
  
        console.log('step b')
        const existingProduct=await Products.findOne({productName:productName})
        console.log('step c')
        console.log(productData._id)
        console.log('step d')
        console.log("existing product => ")
        console.log("existing product is",existingProduct);
        console.log(!existingProduct._id.equals(productData._id))
        console.log("exists 2");
        if(existingProduct && existingProduct.productName===productName   && (!existingProduct._id.equals(productData._id)) )
        {
            console.log("x")
            console.log(existingProduct._id)
            console.log("y")
            console.log(productData.productName)
            console.log("z")
            console.log(productId)
            req.session.productEditError="Already Existing Product"
          
            // res.redirect(`/admin/editProducts?id=${productId}`)
            res.json(false)
        }
        else if(!existingProduct._id.equals(productData._id))
        {
            req.session.productEditError="Already Existing Product"
            // res.redirect(`/admin/editProducts?id=${productId}`)
            res.json(false)

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
                    // res.redirect(`/admin/editProducts?id=${productId}`)
                    res.json(false)
                }
                else
                { 
                    
                    if(productPrice.length===0 || productQuantity.length===0)
                    {
                        req.session.productEditError="Should Not Be Empty"
                        // res.redirect(`/admin/editProducts?id=${productId}`)
                        res.json(false)
                    }
                    else
                    {
                        if(productQuantity>=0 && productPrice>=0)
                         {
                         
                            if ( req.files.length !== 0) {
                                console.log("succes1")
                                console.log(productCategory);

                                const productData = await Products.findByIdAndUpdate({_id:productId},{$set:{productName:productName,productBrand:productBrand,productCategory:productCategory,productPrice:productPrice,productQuantity:productQuantity,productDescription:productDescription,productImage:ImageArray,lastUpdated:lastUpdated}})
                                
                                // res.redirect('/admin/allProducts')
                                res.json(true)
                            }
                            else
                            {
                                console.log("succes2")
                                const productData =  await Products.findByIdAndUpdate({_id:productId},{$set:{productName:productName,productBrand:productBrand,productCategory:productCategory,productPrice:productPrice,productQuantity:productQuantity,productDescription:productDescription,lastUpdated:lastUpdated}})
                                // res.redirect('/admin/allProducts')
                                res.json(true)
                            }

                         }
                         else
                         {
                            req.session.productEditError="Should not be negative values"
                            // res.redirect(`/admin/editProducts?id=${productId}`)
                            res.json(false)
                         }
                     

                    }

                }
                    
            }
            else
            {
                        console.log(" invalid product")
                        req.session.productEditError="Invalid Input"
                        // res.redirect(`/admin/editProducts?id=${productId}`)
                        res.json(false)
    
            }

        }
       
    } catch (error) {
        console.log('step 6')
        console.log(error)
        res.render('errorPage',{error:error})
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
            res.render('errorPage',{error:error})
        }
        
}

const deleteImage=async(req,res)=>{
    try {
        console.log("delete image started");
        const { preview, filename, id } = req.body
        const fullpath = path.join(__dirname, "..", "public", preview)
        await fs.unlink(fullpath);
        const result = await Products.updateOne({ _id: id }, { $pull: { productImage: filename } })
        console.log(result);

        res.status(200).json({ success: true })
    } catch (error) {
        console.log(error);
        res.render('errorPage',{error:error})
    }
}

//All Banners
const allBanners=async(req,res)=>{
    try {
        res.set("Cache-control","no-store")
        console.log("All Banners started @@@@@");

        const allBanners=await Banner.find({})

        console.log("All Banners ended ##########");
        res.render('allBanners',{allBanners:allBanners})
    } catch (error) {
        console.log(error)
        res.render('errorPage',{error:error})
    }
}

// addBanner
const addBanner=async(req,res)=>{
    try {
        console.log("addBanner started ###@@@>>>>>");
        console.log("step 1");
        const bannerName=req.body.bannerName
   
        const startDate=req.body.startDate
        const endDate=req.body.endDate
        console.log("step 2");
        const bannerImage=req.file
        console.log("step 3");
        const bannerDescription=req.body.bannerDescription
        console.log("banner image ",bannerImage);
        console.log("step 4");
        const image=bannerImage.filename
        console.log("step 5");
        console.log("image is",image);
        console.log("step 6");
        const newBanner=new Banner({
            bannerName:bannerName,
            startDate:startDate,
            endDate:endDate,
            bannerImage:image,
            bannerDescription:bannerDescription
        })
        console.log("step 7");
        await newBanner.save()
        console.log("step 8");
        console.log(newBanner);
        
        const data=true;
        console.log("step 9");
        res.json(data)
    } catch (error) {
        console.log("step 10 ERROR");
        console.log(error);
        res.render('errorPage',{error:error})
    }
} 



// editUpadteBanner
const editUpadteBanner=async(req,res)=>{
    try {
        console.log("editUpadteBanner starteddd >>####");
      
        console.log(req.body);
        console.log(req.query);
        
        
        const bannerId=new ObjectId(req.body.bannerId)
        console.log("Bannerid is >>",bannerId);
        const bannerName=req.body.bannerName
        const startDate=req.body.startDate
        const endDate=req.body.endDate
        const bannerDescription=req.body.bannerDescription
        let bannerData;
        if(req.file)
        {
            console.log("image is >>",req.file);
             bannerData=await Banner.findByIdAndUpdate({_id:bannerId},{$set:{bannerName:bannerName,startDate:startDate,endDate:endDate,bannerDescription:bannerDescription,bannerImage:req.file.filename}})
        }
        else
        {
            console.log("no >>image");
             bannerData=await Banner.findByIdAndUpdate({_id:bannerId},{$set:{bannerName:bannerName,startDate:startDate,endDate:endDate,bannerDescription:bannerDescription}})
        }

        bannerData.save()
        const data=true
        res.json(data)

    } catch (error) {
        console.log(error);
        res.render('errorPage',{error:error})
    }
}


// deleteBanner
const deleteBanner=async(req,res)=>{
    try {
        console.log("deleteBanner >>>>");
       
        const bannerId=new ObjectId(req.query.bannerId)
        console.log(bannerId);
        const bannerData=await Banner.findOneAndDelete({_id:bannerId})
        console.log("banner id",bannerId);
        const data=true
        res.json(data)
        
    } catch (error) {
        console.log(error);
        res.render('errorPage',{error:error})
    }
}

module.exports={
    adminLogin,
    adminLogout,
    adminValidation,

    adminDashboard,
    yearlyChart,

    salesReport,
    salesDateFilter,
    dailySalesReport,
    weeklySalesReport,
    monthlySalesReport,
    bestSellingProduct,
    bestSellingBrands,
    bestSellingCategories,

    allOrders,
    orderStatusUpdate,
    orderItems,
    orderItemCancel,
    orderItemStatusUpdate,
    returnStatusUpdate,

    refundWallet,
    verifyRefundPayment,

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
    deleteImage,

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

    allBanners,
    addBanner,
    editUpadteBanner,
    deleteBanner
}

