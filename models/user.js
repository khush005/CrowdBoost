const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const JWT = require('jsonwebtoken');
const Project = require('./project');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    pageName: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid Email Address");
        }
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 7,
      trim: true,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("Password cannot contain 'password' ");
        }
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    avatar: {
      type: Buffer,
    },
    donations: [
      {
        project: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Project'
        },
        title: {
          type: String,
        },
        amountDonated: Number,
        dateDonated: {
          type: Date,
          default: Date.now()
        },
        paymentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Payment'
        },
        paymentStatus: {
          type: String,
          default: 'pending'
        }
      }
    ]
  },
  {
    timestamps: true,
  }
);

userSchema.virtual("projects", {
  ref: "Project",
  localField: "_id",
  foreignField: "creator_id",
});

userSchema.virtual("payments", {
  ref: "Payment",
  localField: "_id",
  foreignField: "userId",
});

userSchema.pre("save", async function (next) {
    const user = this;

    if(user.isModified("password")){
        user.password = await bcrypt.hash(user.password, 10)
    }
    next();
})

userSchema.methods.generateAuthToken = async function () {
    const user = this;

    const token = JWT.sign(
      { _id: user._id.toString()},
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    user.tokens = user.tokens.concat({ token })
    await user.save();
    return token;
}

userSchema.methods.addDonation = async function (projectId, amount) {
  const user = this;
  const project = await Project.findById(projectId);

  if (!project) {
    throw new Error("Project not found");
  }

  const isAlreadyDonated = user.donations.some((donation) =>
    donation.project.equals(project._id)
  );

  if (isAlreadyDonated) {
    throw new Error("Already donated to this project");
  }

  // Add the donation to the user's donations array
  user.donations.push({
    project: project._id,
    title: project.title,
    amountDonated: amount,
    dateDonated: new Date(), // Current date/time
  });

  await user.save();
  return user;
};


const User = mongoose.model("User", userSchema)

module.exports = User;