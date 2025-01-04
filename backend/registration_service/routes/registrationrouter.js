const express=require('express')
const router=express.Router();
const {updateRegistrationStatus,registerForTrip}=require('../controllers/Registrationcontroller')

const authenticateToken = require('../middleware/Authorizationtoken');

router.post('/registerfortrip/:tripId',authenticateToken,registerForTrip)

router.put('/updatestatus/:registrationId',authenticateToken,updateRegistrationStatus)

module.exports=router