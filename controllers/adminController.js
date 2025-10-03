const adminModels = require("../models/adminModel");

module.exports = {
  createAdmin: async (req, res) => {
    const { Name, Email } = req.body;
    console.log(req.body);

    if (!Name || !Email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    try {
      const response = await adminModels.createAdmin({
        Name,
        Email,
      });

      if (response) {
        res.status(201).json(
          response.message
            ? { message: response.message }
            : {
                message: `Admin created successfully \nPassword sended to ${Email}`,
              }
        );
        console.log("Admin created successfully:", response);
      } else {
        res.status(500).json({ message: "Failed to create admin" });
      }
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  getAllAdmins: async (req, res) => {
    try {
      const admins = await adminModels.getAllAdmins();
      res.status(200).json(admins);
      console.log("Fetched all admins successfully:", admins);
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  blockAdmin: async (req, res) => {
    const adminId = req.params.id;
    try {
      const response = await adminModels.blockAdmin(adminId);
      console.log(response);
      if (response.modifiedCount == 1) {
        res.status(200).json({ messgae: "Admin blocked successfully" });
      } else {
        res.status(401).json({ messgae: "Admin not found" });
      }
    } catch (error) {
      res.status(500).json({ messgae: "Internal server error" });
    }
  },

  unBlockAdmin: async (req, res) => {
    const adminId = req.params.id;
    try {
      const response = await adminModels.unBlockAdmin(adminId);
      console.log(response);
      if (response.modifiedCount == 1) {
        res.status(200).json({ messgae: "Admin unblocked successfully" });
      } else {
        res.status(401).json({ messgae: "Admin not found" });
      }
    } catch (error) {
      res.status(500).json({ messgae: "Internal server error" });
    }
  },

  getMerchantRequests: async (req, res) => {
    try {
      console.log("api call goted");

      const response = await adminModels.getMerchantRequests();
      res.json(response);
    } catch (error) {}
  },

  approveMerchant: async (req, res) => {
    try {
      const response = await adminModels.approveMerchant(req.body.merchantId);
      if (response.acknowledged) {
        res.json({ status: true, message: "Merhcant approved" });
      }
    } catch (error) {
      console.error(error);
      res.json({ status: false, message: "Something went wrong" });
    }
  },

  deleteAdmin: async (req, res) => {
    const adminId = req.params.id;
    console.log("Deleting admin with ID:", adminId);

    try {
      const response = await adminModels.deleteAdmin(adminId);
      if (response.deletedCount > 0) {
        res.status(200).json({ message: "Admin deleted successfully" });
        console.log("Admin deleted successfully");
      } else {
        res.status(404).json({ message: "Admin not found" });
      }
    } catch (error) {
      console.error("Error deleting admin:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};
