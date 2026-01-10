import cloudinary from '../config/cloudinary.js';

/**
 * Extracts the public_id from a Cloudinary URL
 * @param {string} url - The secure_url from Cloudinary
 * @returns {string|null}
 */
export const extractPublicId = (url) => {
    if (!url) return null;
    try {
        // Example: https://res.cloudinary.com/demo/image/upload/v1234/nextzen/profiles/user_1.jpg
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        
        if (uploadIndex === -1) return null;
        
        // Get everything after 'upload' and version (v1234)
        const pathParts = parts.slice(uploadIndex + 2);
        
        // Join back and remove extension
        const publicIdWithExtension = pathParts.join('/');
        const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '');
        
        return publicId; // Returns: nextzen/profiles/user_123
    } catch (error) {
        console.error('Error extracting public_id:', error);
        return null;
    }
};

/**
 * Uploads a base64 image string to Cloudinary
 * @param {string} base64String - The base64 encoded image data
 * @param {string} userId - User ID for unique naming
 * @param {string} oldPublicId - Public ID of old image to delete (optional)
 * @returns {Promise<string>} - Returns the secure URL of uploaded image
 */
export const uploadProfileImage = async (base64String, userId, oldPublicId = null) => {
    try {
        // Delete old image if exists
        if (oldPublicId) {
            try {
                await cloudinary.uploader.destroy(oldPublicId);
                console.log(`Old image deleted: ${oldPublicId}`);
            } catch (deleteError) {
                console.error('Error deleting old image:', deleteError.message);
            }
        }

        // Upload new image to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(base64String, {
            folder: 'nextzen/profiles',
            public_id: `user_${userId}`,
            overwrite: true,
            resource_type: 'image',
            transformation: [
                {
                    width: 400,
                    height: 400,
                    crop: 'fill',
                    gravity: 'face',
                    quality: 'auto:good',
                    fetch_format: 'auto'
                }
            ]
        });

        return uploadResponse.secure_url;

    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload image to Cloudinary');
    }
};