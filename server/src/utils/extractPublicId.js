
const extractPublicId = (cloudinaryUrl) => {
    if (!cloudinaryUrl) return null;

    try {

        const parts = cloudinaryUrl.split('/');

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

module.exports = { extractPublicId };
                                