const mongoose=require('mongoose')
require('dotenv').config()
mongoose.connect(process.env.MONGO_URL).then(()=>console.log("connected monogo"))

const logger=require('morgan')

const express=require('express')
const app=express()

app.use(logger('dev'))
app.use(express.static('public'))

// user route
const userRoute=require('./routes/userRoute')
app.use('/',userRoute)
// admin route
const adminRoute=require('./routes/adminRoute')
app.use('/admin',adminRoute)



app.listen(3000,()=>console.log("Hi SreeKuttan,....The Homy Server Started..!!"))