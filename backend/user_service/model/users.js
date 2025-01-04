const mongoose=require('mongoose')
const Schema=mongoose.Schema
const bcrypt = require('bcryptjs');
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true 
    },
    email: {
        type: String,
        required: true,
        unique: true 
    },
    password: {
        type: String,
        required: true
    },
    mobileNumber: {
        type: String,
        required: true,
        unique: true
    },
    age: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    about: {
        type: String,
        required: true
    },
    interests: {
        type: [String],  
        required: true
    },
    places_visited: {
        type: [String],  
        required: true
    },
    likes: {
        type: Number,
        required: true,
        default:0
    },
    followers: {
        type: [String],
        required: true,
        default:[]
    },
    reviews: {
        type: [String], 
        required: true
    },
    badges: {
        type: [String],  
        required: true
    }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports=mongoose.model('User',userSchema)