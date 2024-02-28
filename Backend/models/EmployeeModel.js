const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator")

const employeeSchema = new mongoose.Schema(
    {
        user_name: {
            type: String,
            required: [true, "Please Type your Name!"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Please Type An Email!"],
            unique: true,
            trim:true,
            lowercase:true,
            validate: {
                validator: validator.isEmail,
                message: 'Invalid email format'
            }
        },
        password: {
            type: String,
            required: [true, "Please Type A Strong Password!"],
        },
        userCount:{
            type: Number,
            default: 0,
        },
        users:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
        supervisor:{
            type: mongoose.Schema.Types.ObjectId,
            ref:'Manager',
        },
    },
    {
        timestamps: true,
        collection: "Employees",
    }
);

// Password hashing middleware
employeeSchema.pre('save', async function (next) {
    const salt = await bcrypt.genSaltSync(parseInt(process.env.SALT_ROUNDS));
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

employeeSchema.methods.isPasswordMatched = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

// Define Employee Model
const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;