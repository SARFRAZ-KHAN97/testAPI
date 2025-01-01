const express = require ("express");
const app = express();
const mongoose = require("mongoose");
const authRouter = require("./routes/auth");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

const userModel = require("./models/userModel.js")

dotenv.config();

const dbLink = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.uhvcw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.connect(dbLink)
    .then(function (connection) {
        console.log("connected to db")
    }).catch(err => console.log(err))



app.use(express.json());
app.use(cookieParser());

app.use(authRouter);



app.listen(5000, function() {
    console.log("Server is running on port 5000");
})