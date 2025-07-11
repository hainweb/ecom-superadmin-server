const deliveryModels = require("../models/deliveryModel");

module.exports = {
  createDelivery: async (req, res) => {
    const { Name, Email } = req.body;
    console.log(req.body);

    if (!Name || !Email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    try {
      const response = await deliveryModels.createDelivery({
        Name,
        Email,
      });

      if (response) { 
        res.status(201).json( response.message ? { message: response.message } : { message: `Delivery created successfully \nPassoword sended to ${Email}` });
        console.log("Delivery created successfully:", response);
      } else {
        res.status(500).json({ message: "Failed to create admin" });
      }
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  getAllDeliveries: async (req, res) => {
    
    try {
      const deliveries = await deliveryModels.getAllDeliveries();
      res.status(200).json(deliveries);
      console.log("Fetched all deliveries successfully:", deliveries);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },


  blockDelivery: async (req, res) => {
      const deliveryId = req.params.id;
      try {
        const response = await deliveryModels.blockDelivery(deliveryId);
        console.log(response);
        if (response.modifiedCount == 1) {
          res.status(200).json({ messgae: "Delivery blocked successfully" });
        } else {
          res.status(401).json({ messgae: "Delivery not found" });
        }
      } catch (error) {
        res.status(500).json({ messgae: "Internal server error" });
      }
    },

    unBlockDelivery: async (req, res) => {
      const deliveryId = req.params.id;
      try {
        const response = await deliveryModels.unBlockDelivery(deliveryId);
        console.log(response);
        if (response.modifiedCount == 1) {
          res.status(200).json({ messgae: "Delivery unblocked successfully" });
        } else {
          res.status(401).json({ messgae: "Delivery not found" });
        }
      } catch (error) {
        res.status(500).json({ messgae: "Internal server error" });
      }
    },

  deleteDelivery: async (req, res) => {
    const deliveryId = req.params.id;
    console.log("Deleting delivery with ID:", deliveryId);

    try {
      const response = await deliveryModels.deleteDelivery(deliveryId);
      if (response.deletedCount > 0) {
        res.status(200).json({ message: "Delivery deleted successfully" });
        console.log("Delivery deleted successfully");
      } else {
        res.status(404).json({ message: "Delivery not found" });
      }
    } catch (error) {
      console.error("Error deleting delivery:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};
