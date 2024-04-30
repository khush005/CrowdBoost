const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        trim: true
    }
});

categorySchema.virtual("projects", {
  ref: "Project",
  localField: "_id",
  foreignField: "category_id",
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;