const express = require ("express");
const app = express();

const router = express.Router();

// const authRouter = express.Router();


const authHandler = require("../controller/authController");
// const signUpHandler = require("../controller/authController");
// const logoutHandler = require("../controller/authController");
app.use(express.json());



router.post("/login", authHandler.loginHandler);
router.post("/signup", authHandler.signUpHandler);
router.get("/logout", authHandler.logoutHandler);
router.get("/profile", authHandler.protectedRouteMiddleware, authHandler.profileHandler)




module.exports = router;