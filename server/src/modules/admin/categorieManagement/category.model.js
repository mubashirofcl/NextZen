import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        level: {
            type: Number,
            enum: [1, 2], // 1 = Category, 2 = SubCategory
            required: true,
        },

        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null,
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },

        // --- NEW FIELD FOR OFFERS ---
        offerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Offer",
            default: null,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// INDEXES (IMPORTANT)
categorySchema.index({ name: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ parentId: 1 });
categorySchema.index({ offerId: 1 }); // Index added for faster lookups during price calculation

export default mongoose.model("Category", categorySchema);