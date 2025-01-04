const express=require('express');
const router=express.Router();
const User=require('../model/users')
const {getallUsers,getbyidUser,createUser,getByNameUser,deleteUser,updateUserByUsername}=require('../controller/usercontroller')
const { registerUser, loginUser, deleteByName,profile } = require('../controller/authController');

const authenticateToken = require('../middleware/authMiddleware');

//get all users
router.get('/getallusers',getallUsers);

//get user by id
router.get('/getbyid/:id',getbyidUser);

router.post('/createuser',createUser);

//delete user
router.delete('/deletebyid/:id',authenticateToken,deleteUser)

//get by username
router.get('/getbyusername/:name',getByNameUser)

router.get('/profile',authenticateToken,profile)

//update by username
router.put('/updatebyusername/:username',updateUserByUsername)

//register user
router.post('/register', registerUser);

//login user
router.post('/login', loginUser);


module.exports=router