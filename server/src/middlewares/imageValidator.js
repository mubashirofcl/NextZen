const validateProfileImage = (req, res, next) => {
    const { profilePicture } = req.body;

    if (!profilePicture || profilePicture.startsWith('http')) {
        return next();
    }

    try {

        if (!profilePicture.startsWith('data:image/')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid image format. Please upload a valid image file.'
            });
        }

        const base64Data = profilePicture.split(',')[1];
        if (!base64Data) throw new Error("Malformed base64");

        const sizeInBytes = (base64Data.length * 3) / 4;
        const sizeInMB = sizeInBytes / (1024 * 1024);

        if (sizeInMB > 5) {
            return res.status(400).json({
                success: false,
                message: 'Image size must be less than 5MB'
            });
        }

        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const mimeType = profilePicture.match(/data:([^;]+);/)?.[1];

        if (!validImageTypes.includes(mimeType)) {
            return res.status(400).json({
                success: false,
                message: 'Supported formats: JPG, PNG, WebP only.'
            });
        }

        next();

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Error processing image. Please try again.'
        });
    }
};

export default validateProfileImage;