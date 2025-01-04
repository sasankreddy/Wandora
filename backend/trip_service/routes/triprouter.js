const express=require('express')
const router=express.Router();
const {createTrip,
    searchTrips,
    getalltrips,
    deleteTrip,deleteAllTrips,updateTrip,getTripById,myTrips,updatejoinerslist}=require('../controller/tripcontroller')
const authenticateToken=require('../middleware/authMiddleware')
const Trip=require('../model/trips')

// Public Routes
router.get('/searchtrip', searchTrips);
router.get('/getalltrips', getalltrips);
router.get('/gettripbyid/:id', getTripById);
router.delete('/deleteall', deleteAllTrips);
router.put('/updatejoinedlist/:id',updatejoinerslist );

// Protected Routes
router.post('/createtrip',authenticateToken,createTrip)
router.delete('/deletetrip/:id', authenticateToken, deleteTrip);
router.put('/updatetrip/:id', authenticateToken, updateTrip);
router.get('/mytrips',authenticateToken,myTrips)


module.exports=router