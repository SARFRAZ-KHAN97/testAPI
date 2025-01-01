const mongoose = require("mongoose");

const schemaRules = {
        name: {
            type: String,
            required: [true, "name is required"]
        },
        email: {
            type: String,
            required: [true , "email is required"],
            unique: [true, "email should be unique"]
        },
        password: {
            type: String,
            required: [true, "Paswod is required"],
            minLength: [6, "Password should be atleast 6 length"]
        },
        confirmPassword: {
            type: String,
            required: true,
            validate: [ function () {
                return this.password == this.confirmPassword;
            }, "Password should be same" ]
        },
        craetedAt: {
            type: Date,
            default: Date.now()
        },
        role: {
            type: String,
            enum: ["user","admin","moderator"],  
            default: "user"
        }
}


const userSchema = new mongoose.Schema(schemaRules);

const userModel = mongoose.model("users",userSchema);

module.exports = userModel;