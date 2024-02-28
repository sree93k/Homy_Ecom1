const crypto=require('crypto')
require("dotenv").config()
const generateSessionSecret=()=>{
    return crypto.randomBytes(32).toString('hex')
}
const sessionSecret=generateSessionSecret()


module.exports={sessionSecret}