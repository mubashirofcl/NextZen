import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand", 
      default: null,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    description: {
      type: String,
      trim: true,
    },
    sizeType: {
      type: String,
      enum: ["STANDARD", "FREE_SIZE", "NO_SIZE"],
      default: "STANDARD",
    },
    highlights: {
      type: [String],
      default: [],
    },

    activeOffer: {
      type: String,
      ref: "Offer",
      default: null,
    },

    isFeatured: {
      type: Boolean,
      default: false,
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
  {
    timestamps: true,
  }
);

/* --------------------------------
   INDEXES (SAFE & REQUIRED)
--------------------------------- */

// Admin product listing
productSchema.index({ createdAt: -1 });

// Search
productSchema.index({ name: 1 });

// Category filtering
productSchema.index({ categoryId: 1 });
productSchema.index({ subcategoryId: 1 });

export default mongoose.model("Product", productSchema);
