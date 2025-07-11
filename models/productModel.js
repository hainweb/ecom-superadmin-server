const collections = require("../lib/collections");
const db = require("../lib/connection");
const { ObjectId } = require("mongodb");

const productCollection = () => {
  return db.get().collection(collections.PRODUCT_COLLECTION);
};

const orderCollection = () => {
  return db.get().collection(collections.ORDER_COLLECTION);
};

module.exports = {
  getAllProducts: async () => {
    try {
      const products = await productCollection().find().toArray();
      return products;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },

  getProductById: async (productId) => {
    try {
      const product = await productCollection().findOne({ _id: new ObjectId(productId) });
      if (!product) {
        throw new Error("Product not found");
      }
      return product;
    } catch (error) {
      console.error("Error fetching product by ID:", error);
      throw error;
    }
  },

 getOrdersCount: (proId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let result = await orderCollection()
          .aggregate([
            { $match: { "products.item": new ObjectId(proId) } }, // Match the specific product
            { $unwind: "$products" }, // Deconstruct the products array
            { $match: { "products.item": new ObjectId(proId) } }, // Match again after unwind
            {
              $group: {
                _id: null,
                totalQuantity: { $sum: "$products.quantity" },
              },
            }, // Sum the quantity
          ])
          .toArray();

        let totalQuantity = result.length > 0 ? result[0].totalQuantity : 0;
        resolve(totalQuantity);
      } catch (error) {
        reject(error);
      }
    });
  },


  blockProduct: async (productId) => {
    try {
      const result = await productCollection().updateOne(
        { _id: new ObjectId(productId) },
        { $set: { isBlocked: true } }
      );
      if (result.modifiedCount === 0) {
        return { status: false, message: "Product not found or already blocked" };
      }
      return { status: true, message: "Product blocked successfully" };
    } catch (error) {
      console.error("Error blocking product:", error);
      throw error;
    }
  },

  unBlockProduct: async (productId) => {
    try {
      const result = await productCollection().updateOne(
        { _id: new ObjectId(productId) },
        { $set: { isBlocked: false } }
      );
      if (result.modifiedCount === 0) {
        return { status: false, message: "Product not found or already blocked" };
      }
      return { status: true, message: "Product blocked successfully" };
    } catch (error) {
      console.error("Error blocking product:", error);
      throw error;
    }
  },

  getCategoriesList: async () => {
    try {
      const categories = await productCollection()
        .aggregate([
          {
            $group: {
              _id: null, // We don't need to group by anything specific, just want the unique categories
              categories: { $addToSet: "$Category" }, // Adds unique categories to the 'categories' array
            },
          },
          {
            $project: {
              _id: 0, // Exclude the _id field
              categories: 1, // Include the categories field
            },
          },
        ])
        .toArray();

     
      return categories[0] ? categories[0].categories : []; // Return the list of categories
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  },
};
