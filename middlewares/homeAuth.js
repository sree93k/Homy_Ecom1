const isLogin=async(req,res,next)=>{
    try {
        if(req.session.user_id)
        {
           
        }
        else
        {
            console.log('middleware home')
            res.redirect('/home')
        }
        next() 
    } catch (error) {
        console.log(error.message)
    }
}

const isLogout=async(req,res,next)=>{
    try {
        if(req.session.user_id)
        {
            console.log('middleware home and home')
            res.redirect('/home/home')
        }
        next()
        
    } catch (error) {
        console.log(error.message)
    }
}

const orderConfirm=async(req,res,next)=>{
    try {
        if(req.session.orderConfirmed===false)
        {
            console.log("req.session.orderConfirmed false");
            res.redirect('/home/home')
        }
        next()
        
    } catch (error) {
        
    }
}

const checkout=async(req,res,next)=>{
    try {
        if(req.session.checkout===false)
        {
            console.log("req.session.checkout false");
            res.redirect('/home/home')
        }
        next()
    } catch (error) {
        console.log(error);
    }
}

module.exports={
    isLogin,
    isLogout,
    orderConfirm,
    checkout
}