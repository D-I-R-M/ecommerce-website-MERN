import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true,"Required"]
    },
    description:{
        type: String,
        required: [true,"Required"]
    },
    price:{
        type: Number,
        required: [true,"Required"],
        min: 0
    },
    image:{
        type: String,
        required: [true,"Image Required"]
    },
    category:{
        type: String,
        required: true
    },
    isFeatured:{
        type: Boolean,
        default: false
    }
},{timestamps:true});
const Product = mongoose.model("Product",productSchema);

export default Product;