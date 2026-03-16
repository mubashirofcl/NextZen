const validateProductImages = (req, res, next) => {
    const { variants } = req.body;

    if (!Array.isArray(variants)) {
        return res.status(400).json({ message: "Variants required" });
    }

    for (const variant of variants) {
        if (!Array.isArray(variant.images) || variant.images.length < 3) {
            return res.status(400).json({
                message: "Each variant must have at least 3 images",
            });
        }
        for (const img of variant.images) {
            if (typeof img === "string" && img.startsWith("http")) continue;

            if (!img.startsWith("data:image/")) {
                return res.status(400).json({
                    message: "Invalid image format",
                });
            }

            const base64Data = img.split(",")[1];
            if (!base64Data) {
                return res.status(400).json({ message: "Malformed base64 image" });
            }

            const sizeInBytes = (base64Data.length * 3) / 4;
            const sizeInMB = sizeInBytes / (1024 * 1024);

            if (sizeInMB > 5) {
                return res.status(400).json({
                    message: "Each image must be less than 5MB",
                });
            }
        }
    }

    next();
};

export default validateProductImages;
