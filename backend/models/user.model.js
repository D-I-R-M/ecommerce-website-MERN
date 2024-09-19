import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true,"Required"]
    },
    email:{
        type: String,
        required: [true,"Email required"],
        unique: true,
        lowercase: true,
        trim: true
    },
    password:{
        type: String,
        required: [true,"Password required"],
        minlength: [6,"Must be 6 character long"]
    },
    cartitems:[{
        quantity:{
            type:Number,
            default:1
        },
        product:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"Product"
        }
    }],
    role:{
        type:String,
        enum:["customer","admin"],
        default: "customer"
    }

},
{timestamps:true}
);

// hashing password before saving to db
userSchema.pre("save",async function (next) {
    if(!this.isModified("password")) return next();
    try{
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password,salt);
        next()
    }
    catch(error){
        next(error)
    }
})

userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password,this.password);
}
const User = mongoose.model("User",userSchema);

export default User;