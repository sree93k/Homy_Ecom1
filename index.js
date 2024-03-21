const mongoose=require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/Homy_Project1')

const logger=require('morgan')

const express=require('express')
const app=express()

app.use(logger('dev'))
app.use(express.static('public'))
const userRoute=require('./routes/userRoute')
app.use('/home',userRoute)

const adminRoute=require('./routes/adminRoute')
app.use('/admin',adminRoute)


app.listen(4000,()=>console.log("Hi Sree,....Server Started..!!"))