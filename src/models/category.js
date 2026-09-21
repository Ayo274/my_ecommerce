import mongoose from"mongoose";
const categorySchema = new mongoose.Schema(
    {
        name:{
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        image: {
            type: String,
        },
        parentCategory: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Category',
            default: null,
            imageUrl: {
                type: String,
                default: '',
            }
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Category', categorySchema);