const db = require("../lib/connection");
const collections = require("../lib/collections");
const { ObjectId } = require("mongodb");

const userCollection = () => {
  return db.get().collection(collections.USER_COLLECTION);
};
const orderCollection = () => {
  return db.get().collection(collections.ORDER_COLLECTION);
};
 
module.exports = {
  getAllUsers: async () => {
    try {
      const usersWithOrderCount = await userCollection()
        .aggregate([
          {
            $lookup: {
              from: collections.ORDER_COLLECTION,
              localField: "_id",
              foreignField: "userId",
              as: "orders",
            },
          },
          {
            $addFields: {
              orderCount: { $size: "$orders" },
            },
          },
          {
            $project: {
              orders: 0, // optional: exclude full order data
            },
          },
        ])
        .toArray();

      return usersWithOrderCount;
    } catch (error) {
      throw error;
    }
  },
  getOrderList: async (userId) => {
    try { 
      const orders = await orderCollection()
        .find({ userId: new ObjectId(userId) })
        .toArray();

      return orders;
    } catch (error) {
      throw error;
    }
  },
  getOrderedProducts: async (orderId) => {
    try {
      let orderedProduct = await orderCollection()
        .aggregate([
          {
            $match: { _id: new ObjectId(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collections.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();

      if (!orderedProduct) {
        throw new Error("Order not found");
      }

      return orderedProduct;
    } catch (error) {
      throw error;
    }
  },
  getTotalOrders: async () => {
    try {
      const totalOrders = await orderCollection().find().toArray();
      return totalOrders;
    } catch (error) {
      throw error;
    }
  },
};
