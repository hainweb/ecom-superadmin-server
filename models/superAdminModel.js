const db = require("../lib/connection");
const collections = require("../lib/collections");
const bcrypt = require("bcrypt");

const superAdminCollection = () =>
  db.get().collection(collections.SUPER_ADMIN_COLLECTION);

module.exports = {
  async verifyCredentials(Email, Password) {
    const admin = await superAdminCollection().findOne({ Email });
    if (!admin) return false;
    const isMatch = await bcrypt.compare(Password, admin.Password);
    return isMatch ? admin : false;
  },

  forgotPassword: async (email) => {
    const admin = await superAdminCollection().findOne({ Email: email });
    if (!admin) return false;
    return true;
  },
  resetPassword: async (email, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await superAdminCollection().updateOne(
      { Email: email },
      { $set: { Password: hashedPassword } }    
    );
    return result.modifiedCount > 0;
    }
};
