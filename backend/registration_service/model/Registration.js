const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const registrationSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    trip_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
        required: true
    },
    status: {
        type: String,
        enum: ['requested', 'accepted', 'rejected'],
        required: true,
        default: 'requested'
    },
    reason_for_rejection: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Registration', registrationSchema);
