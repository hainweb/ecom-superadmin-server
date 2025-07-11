const userDisplayModels = require("../models/userDisplayModel");

const { cloudinary } = require("../utils/cloudinary");

module.exports = {
  getCategoriesList: async (req, res) => {
    try {
      const categories = await userDisplayModels.getCategoriesList();
      res.status(200).json(categories);
      console.log("Fetched categories list successfully:", categories);
    } catch (error) {
      console.error("Error fetching categories list:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getCategories: async (req, res) => {
    try {
      const response = await userDisplayModels.getCategories();
      res.status(200).json(response);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  addCategories: async (req, res) => {
    const { Name, LinkTo, image } = req.body;

    try {
      const { Name, LinkTo, image } = req.body;

      if (!Name || !LinkTo || !image) {
        return res
          .status(400)
          .json({ success: false, message: "Missing required fields" });
      }

      let imageUrl = null;
      if (image.startsWith("data:image")) {
        const result = await cloudinary.uploader.upload(image, {
          folder: "categories",
          allowed_formats: ["jpg", "jpeg", "png"],
        });
        imageUrl = result.secure_url;
      }

      const categoryData = { name: Name, linkTo: LinkTo, image: imageUrl };
      console.log("Image added", categoryData);

      userDisplayModels.addCategories(categoryData).then((response) => {
        res.json(response);
      });
    } catch (error) {
      console.error("Error adding category:", error);
      res
        .status(500)
        .json({ success: false, message: "Error adding category", error });
    }
  },
  deleteCategory: async (req, res) => {
    const { id } = req.body;

    try {
      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "Category ID is required" });
      }

      const response = await userDisplayModels.deleteCategory(id);
      if (response.status) {
        res.status(200).json({
          status: true,
          message: "Category deleted successfully",
          categories: response.categories,
        });
      } else {
        res.status(500).json({
          status: false,
          message: "Failed to delete category",
        });
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({
        status: false,
        message: "Something went wrong",
        error: error.message,
      });
    }
  },

  getSliders: async (req, res) => {
    try {
      const sliders = await userDisplayModels.getSliders();
      res.status(200).json(sliders);
    } catch (error) {
      console.error("Error fetching sliders:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  addSlider: async (req, res) => {
    console.log("API call to add slider", req.body, req.file); // multer uses req.file

  if (!req.file || !req.body.linkTo) {
    return res.status(400).json({ message: "Missing required fields" });
  } 

  try {
    const imageUrl = req.file.path; // multer-storage-cloudinary sets this
    const sliderData = {
      image: imageUrl,
      linkTo: req.body.linkTo, 
    };

    const response = await userDisplayModels.addSlider(sliderData);
    res.json({ message: "Slider added", slides: response });
  } catch (error) {
    console.error("Error adding slider:", error);
    res.status(500).json({ message: "Server error", error });
  }
  },
  deleteSlider: async (req, res) => {
    const { id } = req.params;

    try {
      if (!id) {
        return res
          .status(400)
          .json({ success: false, message: "Slider ID is required" });
      }

      const response = await userDisplayModels.deleteSlider(id);
      if (response.status) {
        res.status(200).json({
          status: true,
          message: "Slider deleted successfully",
          sliders: response.sliders,
        });
      } else {
        res.status(500).json({
          status: false,
          message: "Failed to delete slider",
        });
      }
    } catch (error) {
      console.error("Error deleting slider:", error);
      res.status(500).json({
        status: false,
        message: "Something went wrong",
        error: error.message,
      });
    }
  },
};
