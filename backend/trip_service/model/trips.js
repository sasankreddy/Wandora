const mongoose=require('mongoose')
const Schema=mongoose.Schema
const tripschema=new Schema({
    trip_name:{
        required:true,
        type:String
    },
    destination:{
        required:true,
        type:String
    },
    transport:{
        required:true,
        type:String
    },
    trip_size:{
        required:true,
        type:Number
    },
    duration:{
        required:true,
        type:Number
    },
    start_date:{
        required:true,
        type:Date
    },
    end_date:{
        required:true,
        type:Date
    },
    age_requirement:{
        required:true,
        type:Number
    },
    gender_requirement:{
        required:true,
        type:String
    },
    description:{
        required:true,
        type:String
    },
    joined: {
        type: [String],
        required: true,
        default: []
    },
    hashtags: {
        type: [String],
        required: true,
        default: []
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user', 
        required: true 
    }
},{timestamps:true})

module.exports=mongoose.model('Trip',tripschema)