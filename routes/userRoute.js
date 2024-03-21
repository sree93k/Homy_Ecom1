
// ----------------------------------------------------------------------------------------------------------------------------------------------------
//express
const express=require('express')
const user_route=express()

//flash
const flash=require('express-flash')

//session
const session=require('express-session')

//configuration of session secret
const config=require('../config/config')

//multer
const multer=require("multer")
const path=require("path")
const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/images/userpage'))
    },
    filename:function(req,file,cb){
        const name=Date.now()+"-"+file.originalname
        cb(null,name)
    }
})
const upload=multer({storage:storage})

//view engine
user_route.set('view engine','ejs')
user_route.set('views','./views/home')

//flash
user_route.use(flash())

//session setup
user_route.use(session({
    secret:config.sessionSecret,
    resave:false,
    saveUninitialized:false
}))

//auth middleware
const auth=require('../middlewares/homeAuth')
const blockAuth=require('../middlewares/userBlock')

//url enocode
user_route.use(express.json())
user_route.use(express.urlencoded({extended:true}))

//user controller
const userController=require('../controller/userController')
const addressController=require('../controller/addressController')
const categoryController=require('../controller/categoryController')
const couponController=require('../controller/couponController')
const orderController=require('../controller/orderController')
const otpController=require('../controller/otpController')
const walletController=require('../controller/walletController')
const cartController=require('../controller/cartController')
const paymentController=require('../controller/paymentController')
const productController=require('../controller/productController')
const passwordController=require('../controller/passwordController')


//to see user home images
user_route.use(express.static('public'))

// -----------------------Home-Login-Registration--------------------------------------------------------------------------------------------------------------------------
//home before login
user_route.get('/',auth.isLogout,userController.homePageLogout)

//home after login
user_route.get('/home',auth.isLogin,blockAuth.isBlocked,userController.homePageLogin)

//user login
user_route.get('/login',auth.isLogout,userController.userLogin)
user_route.post('/login',auth.isLogout,userController.userVerify)

//user logout
user_route.post('/logout',auth.isLogin,blockAuth.isBlocked,userController.userLogout)

//user register
user_route.get('/register',auth.isLogout,userController.userRegistration)
user_route.post('/register',auth.isLogout,userController.createUser)
//user_route.post('/register',userController.signUpValidation,userController.userCreation,userController.otpGenerator,userController.verifyOtpSignUp)

// -------------------------------OTP Verification---------------------------------------------------------------------------------------------------------------------
//OTP verification
user_route.post('/otpVerification',auth.isLogout,otpController.verifyOtp)

//resendOTP
user_route.get('/resendOTP',auth.isLogout,otpController.resendOTP)

// -------------------------------------Password---------------------------------------------------------------------------------------------------------------
//forgotpassword mail sent
user_route.post('/forgotPassword',auth.isLogout,passwordController.forgotPassword)

//forgot Password Otp Verification
user_route.post('/forgotPasswordOtpVerification',auth.isLogout,passwordController.forgotPasswordOtpVerification)

//forgot passoword- set new password
user_route.post('/forgotPasswordNewEmail',auth.isLogout,passwordController.forgotPasswordNewEmail)

// ----------------------------------User Profile------------------------------------------------------------------------------------------------------------------
//user Profile
user_route.get('/userProfile',auth.isLogin,blockAuth.isBlocked,userController.userProfile)

//edit user profile
user_route.post('/editUserProfile',auth.isLogin,blockAuth.isBlocked,upload.single('file'),userController.editUserProfile)

// -------------------------------------Orders---------------------------------------------------------------------------------------------------------------
//user Orders
user_route.get('/userOrders',auth.isLogin,blockAuth.isBlocked,orderController.userOrders)

// repayment
user_route.post('/repayment',auth.isLogin,blockAuth.isBlocked,paymentController.repayment)

//cancel Order
user_route.post('/cancelOrder',auth.isLogin,blockAuth.isBlocked,orderController.cancelOrder)

//cancel product item 
user_route.post('/cancelOrderItem',auth.isLogin,blockAuth.isBlocked,orderController.cancelOrderItem)

//downloadInvoice
user_route.get('/downloadInvoice',auth.isLogin,blockAuth.isBlocked,orderController.downloadInvoice)

//userRating
user_route.patch('/userRating',auth.isLogin,blockAuth.isBlocked,orderController.userRating)

//returnProduct
user_route.post('/returnProduct',auth.isLogin,blockAuth.isBlocked,orderController.returnProduct)

// buy again
user_route.get('/buyAgain',auth.isLogin,blockAuth.isBlocked,orderController.buyAgain)

// ------------------------------Wishlist----------------------------------------------------------------------------------------------------------------------
//user Wishlist
user_route.get('/userWishlist',auth.isLogin,blockAuth.isBlocked,userController.userWishlist)

// ------------------------------Address----------------------------------------------------------------------------------------------------------------------
//user Address
user_route.get('/userAddress',auth.isLogin,blockAuth.isBlocked,addressController.userAddress)

//add user address
user_route.get('/addAddress',auth.isLogin,blockAuth.isBlocked,addressController.loadAddAddress)
user_route.post('/addAddress',auth.isLogin,blockAuth.isBlocked,addressController.uploadAddAddress)

//edit address
user_route.get('/editAddress',auth.isLogin,blockAuth.isBlocked,addressController.editAddress)
user_route.post('/editAddress',auth.isLogin,blockAuth.isBlocked,addressController.updateEditAddress)

//remove Address
user_route.get('/deleteAddress',auth.isLogin,blockAuth.isBlocked,addressController.deleteAddress)

// ----------------------------------Reset Password------------------------------------------------------------------------------------------------------------------
//user resetPassword
user_route.get('/resetPassword',auth.isLogin,blockAuth.isBlocked,passwordController.resetPassword)

//user resetPassword currentPassword
user_route.post('/currentPassword',auth.isLogin,blockAuth.isBlocked,passwordController.currentPassword)

//resetPasswordOtpVerification
user_route.post('/resetPasswordOtpVerification',auth.isLogin,blockAuth.isBlocked,passwordController.resetPasswordOtpVerification)

//resetNewPassword
user_route.post('/resetNewPassword',auth.isLogin,blockAuth.isBlocked,passwordController.resetNewPassword)

// ---------------------------------------Wallet-------------------------------------------------------------------------------------------------------------
//user Wallet
user_route.get('/userWallet',auth.isLogin,blockAuth.isBlocked,walletController.userWallet)

// add walletx
user_route.post('/addWallet',auth.isLogin,blockAuth.isBlocked,walletController.addWallet)

//verifyAddWallet
user_route.post('/verifyAddWallet',auth.isLogin,blockAuth.isBlocked,walletController.verifyAddWallet)

// ---------------------------------------Referrals-------------------------------------------------------------------------------------------------------------
//user Couponsc
user_route.get('/referals',auth.isLogin,blockAuth.isBlocked,userController.userReferals)

//referral
user_route.get('/referral',auth.isLogout,userController.userRegistration)

// -----------------------------------------Cart-----------------------------------------------------------------------------------------------------------
//user cart
user_route.get('/userCart',auth.isLogin,blockAuth.isBlocked,cartController.userCart)
//add to cart
user_route.post('/addToCart',auth.isLogin,blockAuth.isBlocked,cartController.addToCart)

//remove cart
user_route.post('/removeCart',auth.isLogin,blockAuth.isBlocked,cartController.removeCart)

//cart quantity
user_route.post('/cartQuantity',auth.isLogin,blockAuth.isBlocked,cartController.cartQuantity)

// -----------------------------------------Checkout-----------------------------------------------------------------------------------------------------------
//checkout
user_route.post('/checkout',auth.isLogin,blockAuth.isBlocked,auth.checkout,userController.checkout)

// -----------------------------------------Coupon-----------------------------------------------------------------------------------------------------------
//applyCoupon
user_route.get('/applyCoupon',auth.isLogin,blockAuth.isBlocked,couponController.applyCoupon)

//addOnCoupon
user_route.post('/addOnCoupon',auth.isLogin,blockAuth.isBlocked,couponController.addOnCoupon)

//removeCoupon
user_route.post('/removeCoupon',auth.isLogin,blockAuth.isBlocked,couponController.removeCoupon)

// --------------------------------------------Address Selection--------------------------------------------------------------------------------------------------------
//address selection
user_route.post('/addressSelection',auth.isLogin,blockAuth.isBlocked,userController.addressSelection)

// ------------------------------------------Order Payment----------------------------------------------------------------------------------------------------------
//cash on delivery
user_route.post('/cashOnDelivery',auth.isLogin,blockAuth.isBlocked,paymentController.cashOnDelivery)

//online payment
user_route.post('/netBanking',auth.isLogin,blockAuth.isBlocked,paymentController.onlinePayment)

//payment verify
user_route.post('/verifyPayment',auth.isLogin,blockAuth.isBlocked,paymentController.verifyPayment)

//wallet
user_route.post('/walletPayment',auth.isLogin,blockAuth.isBlocked,paymentController.walletPayment)

// -------------------------------------------Order Confirmation---------------------------------------------------------------------------------------------------------
//order confirmed
user_route.get('/orderConfirmed',auth.isLogin,blockAuth.isBlocked,auth.orderConfirm,orderController.orderConfirmed)

// ---------------------------------------------Category-------------------------------------------------------------------------------------------------------
//all category login
user_route.get('/category',auth.isLogin,blockAuth.isBlocked,categoryController.homeCategoryLogin)

user_route.get('/categoryList',auth.isLogin,blockAuth.isBlocked,categoryController.categoryList)

//search category
user_route.get('/searchCategory',auth.isLogin,blockAuth.isBlocked,categoryController.searchCategory)

//productSearch
user_route.get('/productSearch',auth.isLogin,blockAuth.isBlocked,categoryController.productSearch)

// addToWishlist
user_route.get('/addToWishlist',auth.isLogin,blockAuth.isBlocked,categoryController.addToWishlist)

//removeFromWishlist
user_route.get('/removeFromWishlist',auth.isLogin,blockAuth.isBlocked,categoryController.removeFromWishlist)

//checkWishlist
user_route.get('/checkWishlist',auth.isLogin,blockAuth.isBlocked,categoryController.checkWishlist)

//price filter
user_route.post('/priceFilter',auth.isLogin,blockAuth.isBlocked,categoryController.priceFilter)

//user rating
user_route.post('/productRating',auth.isLogin,blockAuth.isBlocked,categoryController.productRating)

//user sorting
user_route.get('/sorting',auth.isLogin,blockAuth.isBlocked,categoryController.sorting)

//all category logout
user_route.get('/category',auth.isLogout,blockAuth.isBlocked,categoryController.homeCategoryLogout)

// ----------------------------------------------Single Product------------------------------------------------------------------------------------------------------
//single product login
user_route.get('/product',auth.isLogin,blockAuth.isBlocked,productController.eachProductLogin)

//single product logout
user_route.get('/product',auth.isLogout,blockAuth.isBlocked,productController.eachProductLogout)



// ----------------------------------------------------------------------------------------------------------------------------------------------------

//query misdirection avoid setup
user_route.get('*',(req,res)=>{
    res.redirect('/home/home')

})


module.exports=user_route 