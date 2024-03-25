const User=require('../model/userModel')

const isBlocked=async(req,res,next)=>{
    try {
        if(req.session.user_id)
        {
            const userId=await User.findById({_id:req.session.user_id})
            if(userId.isBlocked===true)
            {
                console.log("blockAuth ****** req.session.isBlocked is true ");
                req.session.destroy()
                res.redirect('/')

            }
            else
            {
                console.log("blockAuth >>>>>>> req.session.isBlocked is false ");
            }

        }
        else
        {
            console.log("blockAuth >>>>>>> req.session.isBlocked is no session ");
            console.log(req.session.isBlocked);
        }
        next() 
    } catch (error) {
        console.log(error.message)
    }
}



module.exports={isBlocked }