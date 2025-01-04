require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());  
const mongoose=require('mongoose')
const registrationroutes=require('./routes/registrationrouter')

//PORT  
console.log('Loaded PORT:', process.env.PORT); 

app.get('/', (req, res) => {
    res.send("Registration-service-check");
});

//routes
app.use('/api/routes/registrations',registrationroutes)

//database connection
mongoose.connect(process.env.MONGO_URI).then(()=>{
    app.listen(process.env.PORT, () => {
        console.log(`Connected to TMS-DEV.. Server is running on http://localhost:${process.env.PORT}`);
    });
}).catch((error)=>{
    console.log(error)
})

