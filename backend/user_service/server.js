require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());  
const mongoose=require('mongoose')
const userroutes=require('./routes/userrouter')

//PORT  
console.log('Loaded PORT:', process.env.PORT); 

app.get('/', (req, res) => {
    res.send("user-service-check");
});

//routes
app.use('/api/routes/users',userroutes)

//database connection
mongoose.connect(process.env.MONGO_URI).then(()=>{
    app.listen(process.env.PORT, () => {
        console.log(`Connected to TMS-DEV.. Server is running on http://localhost:${process.env.PORT}`);
    });
}).catch((error)=>{
    console.log(error)
})

