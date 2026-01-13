import cloudinary from '../config/cloudinary.js';

export const extractPublicId = (url) => {
    if (!url) return null;
    try {

        // Example: https://res.cloudinary.com/demo/image/upload/v1234/nextzen/profiles/user_1.jpg

        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        
        if (uploadIndex === -1) return null;
        
        const pathParts = parts.slice(uploadIndex + 2);
        
        const publicIdWithExtension = pathParts.join('/');
        const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '');
        
        return publicId; 
    } catch (error) {
        console.error('Error extracting public_id:', error);
        return null;
    }
};

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