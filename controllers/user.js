const Project = require("../models/project");
const Payment = require("../models/payment");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.logoutAll = async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send("User logout of all devices");
  } catch (e) {
    res.status(500).send("Internal server error");
    console.log(e);
  }
};

exports.getProfile = async (req, res) => {
  try {
    // res.send(req.user)
    res.render("user/profile", { user: req.user, path: "/getProfile" });
  } catch (e) {
    res.status(500).send("Internal server error");
    console.log(e);
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    // res.json(users)
    users.forEach((userImg) => {
      if (userImg.avatar) {
        userImg.avatar = userImg.avatar.toString("base64");
      }
    });

    res.render("user/creators", {
      creators: users,
      // pageTitle: "User",
      path: "/getAllUsers",
    });
  } catch (e) {
    res.status(500).send("Internal server error");
  }
};

exports.homePage = async (req, res) => {
  try {
    res.render("user/home", {
      // pageTitle: 'Home Page',
      path: "/home",
    });
  } catch (e) {
    res.render("error/500");
    console.log(e);
  }
};

exports.getDashboard = async (req, res) => {
  try {
    res.render("user/dashboard", {
      // pageTitle: 'Home Page',
      path: "/dashboard",
    });

    console.log(req.cookies.jwt);
  } catch (e) {
    res.render("error/500");
    console.log(e);
  }
};

exports.getMyDonations = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate({
      path: "donations.project",
      select: "title description",
    });
    if (!user) {
      return res.status(404).render("error", { message: "User not found" });
    }

    res.render("user/getMyDonations", { user: user, path: "/getMyDonations" });
    // res.json(donations);
  } catch (e) {
    console.error(e);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
};

exports.getEditDonation = async (req, res) => {
  try {
    // console.log(req.params.donationId);
    const token = req.cookies.jwt;
    if (!token) {
      throw new Error("Token not found");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const donatedUser = await User.findById(decoded._id).populate({
      path: "donations.project",
    });
    // console.log("donated user----------------", donatedUser)

    if (!donatedUser) {
      throw new Error("User not found");
    }

    const donation = donatedUser.donations.id(req.params.donationId);
    if (!donation) {
      return res.status(404).send("Donation Not found");
    }
    // console.log('DONATION---------------', donation.project.target_amount)
    // console.log('DOnor amt-----------', donation._id.toString())

    res.render("user/editDonation", {
      path: "/editDonation",
      donation,
      user: donatedUser,
    });
  } catch (e) {
    res.status(500).send(e);
    console.log(e);
  }
};

exports.postEditDonation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amountDonated } = req.body;
    const donationId = req.params.donationId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    // console.log(user)

    const donation = user.donations.id(donationId);
    if (!donation) {
      return res.status(404).send("Donation not found");
    }
    console.log("DONATION-------------", donation);

    const project = await Project.findById(donation.project);
    if (!project) {
      return res.status(404).send("Project Not found");
    }

    // Calculate the difference and update the project's current amount
    const donationAmtDiff = amountDonated - donation.amountDonated;
    project.current_amount += donationAmtDiff;

    donation.amountDonated = amountDonated;

    console.log("AFTER------------", donation.amountDonated);

    await user.save();
    await project.save();

    res.redirect("/getMyDonations");
  } catch (e) {
    res.status(500).send(e);
    console.log(e);
  }
};

exports.deleteDonation = async (req, res) => {
  try {
    const userId = req.user._id;
    const donationId = req.params.donationId;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).send("User not found");
    }
    console.log(user.donations);

    const donation = user.donations.id(donationId);
    if (!donation) {
      res.status(404).send("Donation not found");
    }
    donation.deleteOne();
    await user.save();
    // const delete_donation = delete user.donations[donationId]
    // console.log("DELETE------------------", delete_donation)

    // res.render('user/getMyDonations', {
    //   path: '/getMyDonations'
    // })
    await user.save();

    res.redirect("/getMyDonations");
  } catch (e) {
    res.status(500).send(e);
    console.log(e);
  }
};

exports.getEditProfile = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).send("User not found");
    }

    res.render("user/editProfile", {
      path: "/editProfile",
      user,
    });
  } catch (e) {
    res.status(500).send(e);
    console.log(e);
  }
};

exports.postEditProfile = async (req, res) => {
  try {
    const { firstName, lastName, pageName, category, email } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        firstName,
        lastName,
        pageName,
        category,
        email,
      },
      { new: true }
    );
    console.log(user);

    if (!user) {
      res.status(404).send("User not found");
    } else {
      res.redirect("/getProfile");
    }
  } catch (e) {
    res.status(500).send(e);
    console.log(e);
  }
};

exports.getPayment = async (req, res) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      throw new Error("Token not found");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const donatedUser = await User.findById(decoded._id).populate({
      path: "donations.project",
    });
    console.log("Donated user----------", donatedUser);

    if (!donatedUser) {
      throw new Error("User not found");
    }

    const donation = donatedUser.donations.id(req.params.donationId);
    if (!donation) {
      return res.status(404).send("Donation Not found");
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "inr",
              product_data: {
                name: donation.project.title,
              },
              unit_amount: donation.amountDonated * 100, // stripe expects the amt in cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.protocol}://${req.get(
          "host"
        )}/getPayment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get("host")}/getPayment/cancel`,
        client_reference_id: donatedUser._id.toString(),
        metadata: {
          projectId: donation.project._id.toString(),
          donationId: donation._id.toString(),
        },
      });
      res.render("user/payment", {
        path: "/getPayment",
        donation,
        user: donatedUser,
        sessionId: session.id,
      });
    } catch (e) {
      console.log("Stripe session creation error:", e);
      return res.status(500).send("Failed to create Stripe session");
    }
  } catch (e) {
    res.status(500).send(e);
    console.log(e);
  }
};

exports.getPaymentSuccess = async (req, res) => {
  try {
    const sessionId = req.query.session_id;
    if (!sessionId) {
      throw new Error("Session ID not found");
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      throw new Error("Unable to retrieve payment session");
    }

    const payment = new Payment({
      userId: session.client_reference_id, // Make sure to pass client_reference_id when creating the session
      projectId: session.metadata.projectId,
      donationId: session.metadata.donationId, // Pass projectId via metadata when creating the session
      amount: session.amount_total / 100, // Convert from cents to actual amount
      currency: session.currency,
      paymentStatus: session.payment_status, // 'paid' if successful
      paymentId: session.payment_intent, // ID of the payment intent
      paymentMethod: session.payment_method_types[0], // e.g., 'card'
    });

    await payment.save();

    const user = await User.findById(session.client_reference_id);
    const donation = user.donations.id(session.metadata.donationId);
    if (donation) {
      donation.paymentStatus = "paid"; // Update status to 'paid'
      await user.save();
    }

    res.render("user/paymentSuccess", {
      path: "/getPayment/success",
      message: "Payment successful and saved.",
    });
    // res.status(200).send("Payment Done")
  } catch (e) {
    res.status(500).send(e);
    console.log(e);
  }
};

exports.getPaymentCancel = async (req, res) => {
  try {
    res.render('user/paymentCancel', {
      path: '/getPayment/cancel',
      message: 'Your payment was cancelled'
    })
  } catch (e) {
    res.status(500).send(e)
    console.log(e)
  }
}
