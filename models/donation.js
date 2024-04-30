const mongoose = require("mongoose");
// const validator = require("validator")

const donationSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  amount: {
    type: Number,
    required: true,
  },
  donated_at: {
    type: Date,
    default: Date.now(),
  },
  // projects: [
  //   {

  //   }
  // ]

});

const Donation = mongoose.model("Donation", donationSchema);

module.exports = Donation;
