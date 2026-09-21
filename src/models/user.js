import { Timestamp } from "bson";
import strict from "node:assert/strict";
import { settings } from "node:cluster";
import mongoose from "mongoose";
import { type } from "node:os";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['customer', 'admin'], 
        default: 'customer', 
    },
    avatarUrl: {
        type: String,
        default: "",
    },
    settings: {
        language: {
            type: String,
            default: "en",
        },
        marketingNotifications: {
            type: Boolean,
            default: true,
        }
    }
    },
{
    Timestamp: true,
})

export default mongoose.model('User', userSchema);
