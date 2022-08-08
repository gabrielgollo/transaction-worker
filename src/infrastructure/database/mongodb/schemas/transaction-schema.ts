import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
    accountOrigin: {
        type: String,
        required: true
    },
    accountDestination: {
        type: String,
        required: true
    },
    value: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    statusMessage: {
        type: String,
        default: null
    }
});

export default transactionSchema