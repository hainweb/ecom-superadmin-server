const multer = require("multer");
const { createStorage } = require("../utils/cloudinary");

const sliderStorage = createStorage("slider"); // use 'slider' folder
const uploadSlider = multer({ storage: sliderStorage });

module.exports = uploadSlider;
