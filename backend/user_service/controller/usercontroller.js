const User=require('../model/users')


//get all users
const getallUsers=async(req,res)=>{
    const users=await User.find({}).sort({createdAt:-1})
    res.status(200).json(users)
}

//get by id
const getbyidUser = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid User ID format' });
        }
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ error: 'User not registered' });
        }

        res.status(200).json(user); 
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).json({ error: 'Server error while fetching user' });
    }
};


//get by username
const getByNameUser = async (req, res) => {
    const { name } = req.params; 

    try {
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: 'Invalid or missing name parameter' });
        }

        const user = await User.findOne({ username: name });

        if (!user) {
            return res.status(404).json({ error: 'No user found with the given name' });
        }

        res.status(200).json(user); 
    } catch (error) {
        console.error('Error fetching user by name:', error);
        res.status(500).json({ error: 'Server error while fetching user' });
    }
};



//Delete User
const deleteUser=async(req,res)=>{
    const {id}=req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ error: 'Invalid User ID format' });
    }
    const user=await User.findOneAndDelete({_id:id});
    if(!user){
        return res.status(404).json({error:"No user found"})
    }
    return res.status(200).json(user)
}
//Post a user
const createUser=async(req,res)=>{
    console.log(req.body);
    try {
        const {
            username,
            email,
            password,
            mobileNumber,
            age,
            gender,
            city,
            about,
            interests,
            places_visited,
            likes = 0, 
            followers = 0, 
            reviews = '',
            badges = ''
        } = req.body;
        if (!username || !email || !password || !mobileNumber || !age || !gender || !city || !about || !interests || !places_visited) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const newUser = new User({
            username,
            email,
            password,  
            mobileNumber,
            age,
            gender,
            city,
            about,
            interests,
            likes:0,
            followers:[],
            places_visited,
            likes,
            followers,
            reviews,
            badges
        });
        const savedUser = await newUser.save();
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email,
                age: savedUser.age,
                mobileNumber: savedUser.mobileNumber,
                gender: savedUser.gender,
                city: savedUser.city,
                about: savedUser.about,
                interests: savedUser.interests,
                places_visited: savedUser.places_visited,
                likes: savedUser.likes,
                followers: savedUser.followers,
                reviews: savedUser.reviews,
                badges: savedUser.badges,
                createdAt: savedUser.createdAt
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            const duplicateKey = Object.keys(error.keyValue)[0];
            const duplicateValue = error.keyValue[duplicateKey];
            return res.status(400).json({
                message: `Duplicate entry detected: ${duplicateKey} "${duplicateValue}" already exists.`
            });
        }

        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Failed to create user', error });
    }
    }

//update by username
const updateUserByUsername = async (req, res) => {
    const { username } = req.params; 
    const updates = req.body; 

    try {
        if (!username || typeof username !== 'string' || username.trim() === '') {
            return res.status(400).json({ error: 'Invalid or missing username parameter' });
        }

        // Validate the updates object
        if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'Invalid or missing updates in request body' });
        }
        const updatedUser = await User.findOneAndUpdate(
            { username: username },
            { $set: updates },
            { new: true, runValidators: true } 
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'No user found with the given username' });
        }

        res.status(200).json(updatedUser); 
    } catch (error) {
        console.error('Error updating user by username:', error);
        res.status(500).json({ error: 'Server error while updating user' });
    }
};



module.exports={getallUsers,getbyidUser,createUser,getByNameUser,deleteUser,updateUserByUsername,}