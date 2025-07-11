const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET, // check spelling!
});

// Reusable function to create storage for a given folder
const createStorage = (folderName) =>
  new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      return {
        folder: folderName,
        allowed_formats: ['jpg', 'jpeg', 'png'],
      };
    },
  });

function getPublicIdFromUrl(url) {
  const urlParts = url.split('/');
  const fileName = urlParts[urlParts.length - 1];
  const folderPath = urlParts[urlParts.length - 2];
  return `${folderPath}/${fileName.split('.')[0]}`;
}

module.exports = {
  cloudinary,
  createStorage,
  getPublicIdFromUrl,
};
