import cloudinary from "../config/cloudinary.js";

/* Upload ONE image */
export const uploadProductImage = async ({
    base64,
    productId,
    color,
    index,
}) => {
    const res = await cloudinary.uploader.upload(base64, {
        folder: `nextzen/products/${productId}/${color}`,
        public_id: `image_${index}`,
        overwrite: true,
        resource_type: "image",
        transformation: [
            {
                width: 800,
                height: 1000,
                crop: "fill",
                quality: "auto:good",
                fetch_format: "auto",
            },
        ],
    });

    return res.secure_url;
};

/* Upload ALL variant images */
export const processVariantImages = async ({
    variants,
    productId,
}) => {
    const processedVariants = [];

    for (const variant of variants) {
        const uploadedImages = [];

        for (let i = 0; i < variant.images.length; i++) {
            const img = variant.images[i];

            // Keep existing URLs
            if (typeof img === "string" && img.startsWith("http")) {
                uploadedImages.push(img);
                continue;
            }

            const url = await uploadProductImage({
                base64: img,
                productId,
                color: variant.color.replace(/\s+/g, "_").toLowerCase(),
                index: i,
            });

            uploadedImages.push(url);
        }

        processedVariants.push({
            ...variant,
            images: uploadedImages,
        });
    }

    return processedVariants;
};
