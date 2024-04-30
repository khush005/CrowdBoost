const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        creator_id: {
            type: mongoose.Schema.Types.ObjectId,
            // required: true,
            ref: 'User'
        },
        target_amount: {
            type: Number,
            required: true
        },
        current_amount: {
            type: Number,
            default: 0
        },
        start_date: {
            type: Date,
            // required: true
        },
        end_date: {
            type: Date,
            // required: true
        },
        avatar: {
            type: Buffer
        }
    }, {
        toJSON: { virtuals: true }, 
        toObject: { virtuals: true },
        timestamps: true
    }
)

projectSchema.virtual("payments", {
  ref: "Payment",
  localField: "_id",
  foreignField: "projectId",
});

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;