
//express
const express=require('express')
const admin_route=express()

//session
const session=require('express-session')

//view engine
admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin')

//configuration of session secret
const config=require('../config/config')

//session
admin_route.use(session({
    secret:config.sessionSecret,
    resave:false,
    saveUninitialized:false
}))

//url enocode
admin_route.use(express.json())
admin_route.use(express.urlencoded({extended:true}))




//multer
const uploads=require('../middlewares/upload')

const multer=require('multer')
const path=require('path')

const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/images/adminpage'))
    },
    filename:function(req,file,cb){
        const name=Date.now()+"-"+file.originalname
        cb(null,name)
    }
})
  
  // Create multer instance
  const upload = multer({ storage: storage });


//admin Controller
const adminController=require('../controller/adminController')

//auth middleware
const auth=require('../middlewares/adminAuth')

//user block auth
const blockAuth=require('../middlewares/userBlock')


// public static
admin_route.use(express.static('public'))

//login 
admin_route.get('/login',auth.isLogout,adminController.adminLogin)
admin_route.post('/login',auth.isLogout,adminController.adminValidation)

//logout
admin_route.post('/logout',auth.isLogin,adminController.adminLogout)

//dashboard
admin_route.get('/dashboard',auth.isLogin,adminController.adminDashboard)

//salesReport
admin_route.get('/salesReport',auth.isLogin,adminController.salesReport)

//salesDateFilter
admin_route.post('/salesDateFilter',auth.isLogin,adminController.salesDateFilter)

//daily dailySalesReport
admin_route.get('/dailySalesReport',auth.isLogin,adminController.dailySalesReport)

//wweklySalesReport
admin_route.get('/weeklySalesReport',auth.isLogin,adminController.weeklySalesReport)

//monthlySalesReport
admin_route.get('/monthlySalesReport',auth.isLogin,adminController.monthlySalesReport)

//all orders
admin_route.get('/allOrders',auth.isLogin,adminController.allOrders)

//order status
admin_route.post('/orderStatusUpdate',auth.isLogin,adminController.orderStatusUpdate)

//order Item
admin_route.get('/orderItems',auth.isLogin,adminController.orderItems)

//cancel order Items
admin_route.post('/orderItemCancel',auth.isLogin,adminController.orderItemCancel)

//orderItemStatusUpdate
admin_route.post('/orderItemStatusUpdate',auth.isLogin,adminController.orderItemStatusUpdate)

//returnStatusUpdate
admin_route.post('/returnStatusUpdate',auth.isLogin,adminController.returnStatusUpdate)

//refundWallet
admin_route.post('/refundWallet',auth.isLogin,adminController.refundWallet)

//verifyRefundPayment
admin_route.post('/verifyRefundPayment',auth.isLogin,adminController.verifyRefundPayment)

//users
admin_route.get('/allUsers',auth.isLogin,adminController.allUsers)

//add user
admin_route.get('/addUser',auth.isLogin,adminController.addUser)

//delete User
admin_route.delete('/deleteUser',auth.isLogin,adminController.deleteUser)

//Block user
admin_route.post('/blockUser/:userid',auth.isLogin,adminController.blockUser)

//products

//all products
admin_route.get('/allProducts',auth.isLogin,adminController.allProducts)

//add products
admin_route.get('/addProducts',auth.isLogin,adminController.loadAddProducts)
admin_route.post('/addProducts',auth.isLogin,uploads.uploadSingle,adminController.addProducts)

//edit products
admin_route.get('/editProducts',auth.isLogin,adminController.loadEditProducts)
admin_route.post('/editProducts',auth.isLogin,uploads.uploadSingle,adminController.editProducts)

//delete product
admin_route.delete('/deleteProduct',auth.isLogin,adminController.deleteProduct)


//all category
admin_route.get('/allCategory',auth.isLogin,adminController.allCategory)

//add category
admin_route.post('/addCategory',auth.isLogin,adminController.addCategory)

//edit category
admin_route.post('/editCategory',auth.isLogin,adminController.editCategory)

//delete Category
admin_route.delete('/deleteCategory',auth.isLogin,adminController.deleteCategory)

//offers
admin_route.get('/allOffers',auth.isLogin,adminController.allOffers)

//addOffer
admin_route.post('/addOffer',auth.isLogin,upload.single('offerImage'),adminController.addOffer)

//deleteOffer
admin_route.get('/deleteOffer',auth.isLogin,adminController.deleteOffer)

//editOffer
admin_route.get('/editOffer',auth.isLogin,adminController.editOffer)

//editUpadteOffer
admin_route.post('/editUpadteOffer',auth.isLogin,upload.single('editImage'),adminController.editUpadteOffer)

//coupons
admin_route.get('/allCoupons',auth.isLogin,adminController.allCoupons)

//add coupons
admin_route.post('/addCoupons',auth.isLogin,adminController.addCoupons)

//remove coupon
admin_route.post('/removeCoupon',auth.isLogin,adminController.removeCoupon)

//banners
admin_route.get('/allBanners',auth.isLogin,adminController.allBanners)


//query misdirection avoid setup
admin_route.get('*',(req,res)=>{
    res.redirect('/admin/dashboard')

})

module.exports=admin_route
