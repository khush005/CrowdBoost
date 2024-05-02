const express = require('express')
const authController = require('../controllers/auth')
const auth = require('../middleware/auth')
const multer = require('multer')

const router = express.Router()

const upload = multer({
  // dest: "avatars",
  limits: {
    fileSize: 10000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(
        new Error("Plz upload a image of format either jpg, jpeg or png")
      );
    }
    cb(undefined, true);
  },
});

router.get('/login', authController.getLogin)
router.post('/login', authController.postLogin)
router.get("/signup",  authController.getSignup);
router.post("/signup", upload.single("avatar"), authController.postSignup);
router.get("/logout", auth, authController.logout)

router.get("/forgot-password", authController.getForgotPassword);
router.post("/forgot-password", authController.postForgotPassword);
router.get("/reset-password/:token", authController.getResetPassword);
router.post("/reset-password/:token", authController.postResetPassword);


module.exports = router;