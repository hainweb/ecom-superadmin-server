const db = require("../lib/connection");
const collections = require("../lib/collections");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const sendEmail = require("../utils/mailer");

const adminCollection = () => {
  return db.get().collection(collections.ADMIN_COLLECTIONS);
};

module.exports = {
  createAdmin: async ({ Name, Email }) => {
    try {
      const isAdminExists = await adminCollection().findOne({ Email });
      console.log(isAdminExists);
      if (isAdminExists) {
        return { message: "Admin already exists" };
      }
      let Password = Math.random().toString(36).slice(-8);
      console.log(Password);

      const hashedPassword = await bcrypt.hash(Password, 10);
      console.log("Hashed Password:", hashedPassword);

      let response = await adminCollection().insertOne({
        Name,
        Email,
        Password: hashedPassword,
      });

   await sendEmail({
      to: Email,
      subject: "Your Admin Account Details",
      text: `Hello ${Name},\n\nYour admin account has been created.\n\nEmail: ${Email}\nPassword: ${Password}\n\nPlease login and change your password.`,
    });
      
      return response;
    } catch (error) {
      console.error("Error creating admin:", error);
      throw error;
    }
  },
  getAllAdmins: async () => {
    try {
      const admins = await adminCollection().find().toArray();
      return admins;
    } catch (error) {
      console.error("Error fetching all admins:", error);
      throw error;
    }
  },

  blockAdmin: async (adminId) => {
    try {
      const response = await adminCollection().updateOne(
        { _id: new ObjectId(adminId) },
        {
          $set: {
            isBlock: true,
          },
        }
      );
      return response
    } catch (error) {}
  },

  unBlockAdmin: async (adminId) => {
    try {
      const response = await adminCollection().updateOne(
        { _id: new ObjectId(adminId) },
        {
          $set: {
            isBlock: false,
          },
        }
      );
      return response
    } catch (error) {}
  },

  deleteAdmin: async (adminId) => {
    try {
      const response = await adminCollection().deleteOne({
        _id: new ObjectId(adminId),
      });
      return response;
    } catch (error) {
      console.error("Error deleting admin:", error);
      throw error;
    }
  },
};
