const productModels = require("../models/productModel");

module.exports = {
  getAllProducts: async (req, res) => {
    try {
      const products = await productModels.getAllProducts();

      for (let product of products) {
        product.ordercount = await productModels.getOrdersCount(product._id);
      } 

      res.status(201).json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getProductById: async (req, res) => {
    const productId = req.params.id;
    try {
      const product = await productModels.getProductById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.status(200).json(product);
    } catch (error) {
      console.error("Error fetching product by ID:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  blockProduct: async (req, res) => {
    const productId = req.params.id;
    try {
      const response = await productModels.blockProduct(productId);
      if (!response.status) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.status(200).json({ message: "Product blocked successfully", status:true });
    } catch (error) {
      console.error("Error blocking product:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  unBlockProduct: async (req, res) => {
    const productId = req.params.id;
    try {
      const response = await productModels.unBlockProduct(productId);
      if (!response.status) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.status(200).json({ message: "Product unblocked successfully", status:true });
    } catch (error) {
      console.error("Error unblocking product:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getCategoriesList: async (req, res) => {
    try {
      const categories = await productModels.getCategoriesList();
      res.status(200).json(categories);
      console.log("Fetched categories list successfully:", categories);
    } catch (error) {
      console.error("Error fetching categories list:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};
