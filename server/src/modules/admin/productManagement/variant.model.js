import mongoose from "mongoose";

const sizeSchema = new mongoose.Schema(
    {
        size: String,
        stock: Number,
        originalPrice: Number,
        salePrice: Number,
        isActive: Boolean,
    },
    { _id: false }
);

const variantSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        color: String,
        hex: String,
        images: [String],
        sizes: [sizeSchema],
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

variantSchema.index({ productId: 1 });

export default mongoose.model("Variant", variantSchema);
