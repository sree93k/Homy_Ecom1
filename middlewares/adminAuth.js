const isLogin=async(req,res,next)=>{
    try {
        if(req.session.adminId)
        {
           console.log("hello admin is login>>>>");
        }
        else
        {
            res.redirect('/admin/login')
        }
        next() 
    } catch (error) {
        console.log(error.message)
    }
}

const isLogout=async(req,res,next)=>{
    try {
        if(req.session.adminId)
        {
            res.redirect('/admin/dashboard')
        }
        next()
        
    } catch (error) {
        console.log(error.message)
    }
}

module.exports={
    isLogin,
    isLogout
}