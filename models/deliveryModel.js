const db = require("../lib/connection");
const collections = require("../lib/collections");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const sendEmail = require("../utils/mailer");

const deliveryCollection = () => {
  return db.get().collection(collections.DELIVERY_COLLECTIONS);
};

module.exports = {
  createDelivery: async ({ Name, Email }) => {
    try {
      const isDeliveryExists = await deliveryCollection().findOne({ Email });
      console.log(isDeliveryExists);
      if (isDeliveryExists) {
        return { message: "This account already exists" };
      }
      let Password = Math.random().toString(36).slice(-8);
     

      const hashedPassword = await bcrypt.hash(Password, 10);
      console.log("Hashed Password:", hashedPassword);

      let response = await deliveryCollection().insertOne({
        Name,
        Email,
        Password: hashedPassword,
      });

      await sendEmail({
        to: Email,
        subject: "Your Delivery Account Details",
        text: `Hello ${Name},\n\nYour delivery account has been created.\n\nEmail: ${Email}\nPassword: ${Password}\n\nPlease login and change your password.`,
      });

      return response;
    } catch (error) {
      console.error("Error creating delivery:", error);
      throw error;
    }
  },
  getAllDeliveries: async () => {
    try {
      const deliveries = await deliveryCollection().find().toArray();
      return deliveries;
    } catch (error) {
      console.error("Error fetching all deliveries:", error);
      throw error;
    }
  },

  blockDelivery: async (deliveryId) => {
    try {
      const response = await deliveryCollection().updateOne(
        { _id: new ObjectId(deliveryId) },
        {
          $set: {
            isBlock: true,
          },
        }
      );
      return response;
    } catch (error) {}
  },

  unBlockDelivery: async (deliveryId) => {
    try {
      const response = await deliveryCollection().updateOne(
        { _id: new ObjectId(deliveryId) },
        {
          $set: {
            isBlock: false,
          },
        }
      );
      return response;
    } catch (error) {}
  },

  deleteDelivery: async (deliveryId) => {
    try {
      const response = await deliveryCollection().deleteOne({
        _id: new ObjectId(deliveryId),
      });
      return response;
    } catch (error) {
      console.error("Error deleting delivery:", error);
      throw error;
    }
  },
};
