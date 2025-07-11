const userModels = require("../models/userModel");
const { get } = require("../router");



module.exports = {
    getAllUsers: async (req, res) => {
        try {
            const users = await userModels.getAllUsers();
            res.status(200).json(users);
           
        } catch (error) {
            console.error("Error fetching users:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getOrderList: async (req, res) => {
        const userId = req.params.userId;
        try {
            const orders = await userModels.getOrderList(userId);
            if (orders) {
                res.status(200).json(orders);
            } else {
                res.status(404).json({ message: "No orders found for this user" });
            }
        } catch (error) {
            console.error("Error fetching order list:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },
    getOrderedProducts: async (req, res) => {
        const orderId = req.params.orderId;
        console.log(`order id is ${orderId}`);
        
        try {
            const order = await userModels.getOrderedProducts(orderId);
            console.log(order);
            
            if (order) {
                res.status(200).json(order);
            } else {
                res.status(404).json({ message: "No products found for this order" });
            }
        } catch (error) {
            console.error("Error fetching ordered products:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    getTotalOrders: async (req, res) => {
        try {
            const totalOrders = await userModels.getTotalOrders();
            res.status(200).json(totalOrders);
        } catch (error) {
            console.error("Error fetching total orders:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}
