import cloudinary from "../config/cloudinary.js";

/* Upload ONE brand logo */
export const uploadBrandLogo = async ({ base64, brandName }) => {
    const res = await cloudinary.uploader.upload(base64, {
        folder: "nextzen/brands",
        public_id: brandName
            .toLowerCase()
            .replace(/\s+/g, "_"),
        overwrite: true,
        resource_type: "image",
        transformation: [
            {
                width: 500,
                height: 500,
                crop: "fill",
                quality: "auto:good",
                fetch_format: "auto",
            },
        ],
    });

    return res.secure_url;
};
