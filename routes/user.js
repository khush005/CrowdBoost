const express = require('express')
const userController = require('../controllers/user')
const auth = require("../middleware/auth");

const router = express.Router()

router.get('/getProfile', auth, userController.getProfile)
router.get("/editProfile/:userId", userController.getEditProfile)
router.post("/updateProfile/:userId", auth, userController.postEditProfile);

router.get('/getAllUsers', userController.getAllUsers);
router.get('/home', userController.homePage);
router.get('/dashboard', auth, userController.getDashboard)

router.get('/getMyDonations', auth, userController.getMyDonations);
router.get('/editDonation/:donationId', userController.getEditDonation);
router.post("/updateDonation/:donationId", auth, userController.postEditDonation);
router.get("/deleteDonation/:donationId", auth, userController.deleteDonation);

router.get("/getPayment/success", auth, userController.getPaymentSuccess)
router.get("/getPayment/:donationId", auth, userController.getPayment);
router.get("/getPayment/cancel", auth, userController.getPayment);

module.exports = router;