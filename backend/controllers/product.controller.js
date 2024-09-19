import {redis} from '../lib/redis.js';
import cloudinary from '../lib/cloudinary.js';
import Product from "../models/product.model.js";

export const getAllProducts = async (req,res) => {
    try{
        const products = await Product.find({});
        res.json({products});
    }catch(error){
        console.log("Error getting all products controller page",error.message);
        res.status(500).json({message:"Error getting all products",error: error.message});
    }
};

export const getFeaturedProducts = async (req,res) => {
    try{

        let featuredProducts = await redis.get("featuredProducts");
        if(featuredProducts)
            {
            return res.json(JSON.parse(featuredProducts));
        }

        featuredProducts = await Product.find({isFeatured: true}).lean();
        if(!featuredProducts)
            {
            return res.status(404).json({message:"No featured products found"});
        }


        await redis.set("featuredProducts",JSON.stringify(featuredProducts));
        
        res.json(featuredProducts);

    }catch(error){
        console.log("Error getting featured products controller page",error.message);
        res.status(500).json({message:"Error getting featured products",error: error.message});
    }
};

export const createProduct = async (req,res) => {
    try{
        const{name,description,price,image,category} = req.body;
        let cloudinaryResponse = null
        if(image){
           cloudinaryResponse = await cloudinary.uploader.upload(image,{folder:"products"})
        }
        const product = await Product.create({
            name,
            description,
            price,
            image:cloudinaryResponse?.secure_url? cloudinaryResponse.secure_url : "",
            category
        })
        res.status(201).json(product)
    }
    catch(error){
        console.log("Error in createaProduct contoller",error.message);
        res.status(500).json({message:"Server error",error:error.message});
    }
};


export const deleteProduct = async (req,res) => {
    try {
        const product = await Product.findById(req.params.id);
        if(!product){
            return res.status(404).json({message:"Product not found"});
        }
        if(product.image){
            const publicId = product.image.split("/").pop().split(".")[0];
            try {
                await cloudinary.uploader.destroy(`products/${publicId}`);
                console.log("Image deleted from cloudinary");
                
            } catch (error) {
                console.log("Error deleting",error);
                
            }
        }
        await Product.findByIdAndDelete(req.params.id);
        res.json({message:"Product deleted"});
    } catch (error) {
        console.log("Error in deleteProduct contoller",error);
        res.status(500).json({message:"Server error",error:error.message});
    }
};

export const getRecommendedProducts = async (req,res) => {
    try{
        const products = await Product.aggregate([
            {
                $sample:{size:3}
            },
            {
                $project:{
                    _id:1,
                    name:1,
                    description:1,
                    image:1,
                    price:1,
                }
            }

        ])
        res.json({products});
    }catch(error){
        console.log("Error getting recommended products controller page",error.message);
        res.status(500).json({message:"Error getting recommended products",error: error.message});
    }};

export const getProductsByCategory = async (req,res) => {
    const {category} = req.params;
    try{
        const products = await Product.find({category});
        res.json({products});
    }catch(error){  
        console.log("Error getting products by category controller page",error.message);
        res.status(500).json({message:"Error getting products by category",error: error.message});
        
    }    
};

export const toggleFeaturedProduct = async (req,res) => {

    try{
        const product = await Product.findById(req.params.id);
        if(product){
            product.isFeatured = !product.isFeatured;
            const updatedProduct = await product.save();
            await updateFeaturedProductsCache();
            res.json(updatedProduct);

        }
        else{
            res.status(404).json({message:"Product not found"});
        }
    }catch(error){
        console.log("Error toggling featured product controller page",error.message);
        res.status(500).json({message:"Error toggling featured product",error: error.message});
    }
};

async function updateFeaturedProductsCache(){
    try {
        const featuredProducts = await Product.find({isFeatured: true}).lean();
        await redis.set("featuredProducts",JSON.stringify(featuredProducts));
    } catch (error) {
        console.log("Error updating featured products cache");
        
    }
;
}