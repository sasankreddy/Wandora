const express=require('express')
const app=express()
require('dotenv').config()
const mongoose=require('mongoose')
app.use(express.json())
const triproutes=require('./routes/triprouter')

console.log('Loaded PORT:', process.env.PORT); 
//service-up check
app.get('/',(req,res)=>{
    res.send("trip_service up check")
})

app.use('/api/routes/trips',triproutes)

mongoose.connect(process.env.MONGO_URI).then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`Connected to TMS-DEV.. Server is running on http://localhost:${process.env.PORT}`);
    })
}).catch((error)=>{
    console.log(error)
})