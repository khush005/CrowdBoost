const bcrypt = require('bcryptjs')
const User = require('../models/user');
const Project = require('../models/project');
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
    const { email, password } = req.body;

    // Attempt to find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send("Login failed: User not found"); // 401 Unauthorized
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send("Login failed: Incorrect password"); // 401 Unauthorized
    }
    
    const token = await user.generateAuthToken();
    console.log(`Token part: ${token}`)

    res.cookie("jwt", token, {
      expires: new Date(Date.now() + 3600000),
      httpOnly: true
    })
    console.log(`This is a cookie: ${req.cookies.jwt}`)

    if (isMatch) {
      // res.status(201).render("auth/login")
      res.redirect("/createProject")
    }
    else {
      res.send("Password not Matching")
    }

  } catch (e) {
    res.status(400).send("Invalid Login Credentials")
    console.log(e)
  }
};

exports.getForgotPassword = async (req, res) => {
  try {
    res.render('auth/forgotPassword', {
      path: '/forgot-password'
    })
  } catch (e) {
    res.status(500).send('Internal server error')
    console.log(e)
  }
}

exports.postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({email});

    if (!user) {
      return res.status(404).send( "No account with this email address exists.");
    }

    // USING CRYPTOGRAPHIC FUNCTIONS
    // const token = crypto.randomBytes(20).toString('hex')

    
    // USING JWT
    /*
    const token = JWT.sign(
      {
        _id: user._id.toString(),
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
      },
      process.env.JWT_SECRET
    );
    */

   // USING BCRYPT
   const salt = await bcrypt.genSalt(10);
   const token = await bcrypt.hash(user._id.toString() + Date.now().toString(), salt)  

   user.resetPasswordToken = token;
   user.resetPasswordExpires = Date.now() + 3600000;  // 1h

   await user.save();

  const transport = nodemailer.createTransport({
    service: "gmail",
    host: "smtp@gmail.com",
    secure: false,
    auth: {
      user: process.env.EMAIL_TEST,
      pass: process.env.EMAIL_PWD,
    },
  });

  await transport.sendMail({
    from: process.env.EMAIL_TEST,
    to: user.email,
    subject: "Password reset",
    html: `You are receiving this because you (or someone else) have requested the reset of the password for your        account.\n\n` +
            `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
            `http://${req.headers.host}/reset-password/${token}\n\n` +
            `If you did not request this, please ignore this email and your password will remain unchanged.\n`
  }); 

  res.send(
    "An e-mail has been sent to " + user.email + " with further instructions."
  );

  } catch (e) {
    res.status(500).send("Error sending the email");
    console.log(e);
  }
};


exports.getResetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    })

    if (!user) {
      return res
        .status(404)
        .send("Password reset token is invalid or has expired.");
    }

    res.render("auth/resetPassword", {
      token: req.params.token,
      path: '/reset-password'
    })

  } catch (e) {
    res.status(500).send('Internal server error')
    console.log(e)
  }
}


exports.postResetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    console.log('USER---------------', user)
    console.log('TOKEN--------------------', req.params.token)
    console.log('PASSWORD----------', req.body.password)

    if (!user) {
      return res
        .status(404)
        .send("Password reset token is invalid or has expired.");
    }

    if(!req.body.password) {
      return res.status(400).send('Password is required.')
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10)

    user.password = hashedPassword;
    console.log('HASHED PASSWORD-----------------', user.password)
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    console.log('USER RESET------------------------------------------', user)

    await user.save();

    // const isMatch = await bcrypt.compare(req.body.password, user.password);
    // if (isMatch) {
    //   res.send('Your Password has been updated');
    // }

  } catch (e) {
    res.status(500).send("Internal server error");
    console.log(e);
  }
}