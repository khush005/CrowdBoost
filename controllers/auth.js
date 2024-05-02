const crypto = require("crypto");
const bcrypt = require('bcryptjs')
const User = require('../models/user');
const sharp = require('sharp')
const nodemailer = require('nodemailer')
require('dotenv').config()

exports.getLogin = (req, res) => {
    res.render("auth/login", {
      // pageTitle: "Login",
      path: "/login",
    });
}

exports.logout = async (req, res) => {
  try {
    console.log(req.user)

    req.user.tokens = []

    res.clearCookie("jwt")
    console.log("Logout successfully")

    await req.user.save();
    res.render("user/home", { path: '/home' });
    // res.redirect("/login")
  } catch (e) {
    res.status(500).send(e)
  }
}

exports.getSignup = (req, res) => {
    res.render("auth/signup", {
      // pageTitle: "Signup",
      path: "/signup",
    });
}

exports.postSignup = async (req, res) => {
  try {
    const { firstName, lastName, pageName, category, email, password } = req.body;

    if (!req.file) {
      return res.status(400).send({error: 'Avatar file is required'})
    }

    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    // user.avatar = buffer;

    // const hashedPassword = await bcrypt.hash(password, 10)

    const user = new User({
      firstName,
      lastName,
      pageName,
      category,
      email,
      password,
      avatar: buffer
    });
    // if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    //   return res.status(400).send({ error: "Invalid email format" });
    // }


    // const existingUser = await User.findOne({ email });
    // if (existingUser) {
    //   return res.status(400).send({ error: "Email already in use" });
    // }
    // console.log(`success part is ${user}`)
    // sendWelcomeEmail(user.email, user.username);
    
    const token = await user.generateAuthToken();
    console.log(`Token: ${token}`)
    
    // res.status(201).send({ user, token });
    
    res.cookie("jwt", token, {
      expires: new Date(Date.now() + 3600000),
      httpOnly: true,
    });
    // console.log(cookie)
    
    const registered = await user.save()
    console.log(`Registered User: ${registered}`)

    const transport = nodemailer.createTransport({
      service: 'gmail',
      host: "smtp@gmail.com",
      secure: false,
      auth: {
        user: process.env.EMAIL_TEST,
        pass: process.env.EMAIL_PWD
      }
    })

    transport.sendMail({
      from: process.env.EMAIL_TEST,
      to: user.email,
      subject: "Your account has been created!",
      html: `<h2>Welcome to CrowdBoost!</h2> <h3>Thank you ${user.pageName} for joining us on this exciting journey. Together, let's amplify each other's voices, inspire change, and make dreams come true! Happy crowdfunding! ✨</h3>`,
    });

    // res.render("auth/signup")
    res.redirect("/login")
  } catch (e) {
    res.status(400).send(e)
    console.log(e)
  }
}

exports.postLogin = async (req, res, next) => {
  try {
    // Fetch the user by email
    const user = await User.findOne({ email: req.body.email.trim() });
    if (!user) {
      return res.status(401).send("Login failed: User not found"); // 401 Unauthorized
    }
    console.log("STORED HASH-----------------", user.password);

    // No need to hash input password here for logging; just compare
    // const inputHash = await bcrypt.hash(req.body.password, 10);
    // console.log('INPUT HASH------------------', inputHash);

    // Check if the password matches
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    console.log("ISMATCH---------------", isMatch);
    if (!isMatch) {
      return res.status(401).send("Login failed: Incorrect password"); // 401 Unauthorized
    }

    // Generate a token and store it in a cookie
    const token = await user.generateAuthToken();
    console.log(`Token part: ${token}`);

    res.cookie("jwt", token, {
      expires: new Date(Date.now() + 3600000), // Sets cookie to expire in 1 hour
      httpOnly: true, // The cookie only accessible by the web server
    });

    // Successful login redirects to createProject page
    res.redirect("/createProject");
  } catch (e) {
    console.log(e);
    res.status(400).send("Invalid Login Credentials");
  }
};



// Mailer configuration
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_TEST,
    pass: process.env.EMAIL_PWD,
  },
});

const sendResetPasswordMail = (req, email, token) => {
  const resetUrl = `http://${req.headers.host}/reset-password/${token}`;
  transporter.sendMail(
    {
      to: email,
      from: process.env.EMAIL_USERNAME, // Ensure this environment variable is correctly set in your .env file
      subject: "Password Reset",
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        ${resetUrl}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    },
    (error, info) => {
      if (error) {
        console.log("Error sending email:", error);
        return;
      }
      console.log("Email sent:", info.response);
    }
  );
};



exports.getForgotPassword = (req, res) => {
  res.render("auth/forgot-password", { path: "/forgot-password" });
};

exports.postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      console.log("user does not exist");
    }

    const resetPasswordToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    sendResetPasswordMail(req, user.email, resetPasswordToken)
    
    await user.save();
    res.send(
      "An e-mail has been sent to " + user.email + " with further instructions."
    );
  } catch (error) {
    res
      .status(500)
      .send("Error sending the password reset email. Try again later.");
  }
};

exports.getResetPassword = async (req, res) => {
  const token = req.params.token;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res
      .status(404)
      .send("Password reset token is invalid or has expired.");
  }
  res.render("auth/reset-password", {
    path: "/reset-password",
    token
  });
};

exports.postResetPassword = async (req, res) => {
  try {
    const token = req.params.token;
    const newPassword = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(404)
        .send("Password reset token is invalid or has expired.");
    }

    // if (!req.body.password) {
    //   return res.status(400).send("Password is required.");
    // }

    // const newPassword = await bcrypt.hash(req.body.password, 10);
    // console.log('NEW------------------', newPassword.password)
    user.password = newPassword.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).redirect('/login');
  } catch (error) {
    res.status(500).send("Internal server error");
  }
};
