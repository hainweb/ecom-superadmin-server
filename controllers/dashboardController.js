const dashboardModels = require("../models/dashboardModel");

module.exports = {
  getTotalRevenue: async (req, res) => {

    try {
      let totalInStock = 0;
      let totalLowStock = 0;
      let totalOutOfStock = 0;
      const products = await dashboardModels.getProducts();
      totalInStock = products.filter((product) => product.Quantity > 10).length;
      totalLowStock = products.filter(
        (product) => product.Quantity <= 10 && product.Quantity > 0
      ).length;
      totalOutOfStock = products.filter(
        (product) => product.Quantity <= 0
      ).length;

      console.log("API call to get revenue");
      const response = await dashboardModels.getTotalRevenue();
      console.log("got total result", response);

      const pendingOrders =
        response.totalOrders -
        response.canceledOrders -
        response.deliveredOrders;
      console.log("Pending orders", pendingOrders);

      const pendingCashToAdmin =
        response.deliveredOrders - response.cashToAdminOrders;
      console.log("Pending cash", pendingCashToAdmin);

      const conversionRate = parseFloat(
        ((response.deliveredOrders / response.totalUser) * 100).toFixed(2)
      );
      console.log("conversion rate", conversionRate);

      const averageOrderValue = parseFloat(
        (response.deliveredRevenue / response.deliveredOrders).toFixed(2)
      );
      console.log("Average order value", averageOrderValue);

      /*  const totalInStock = response.totalInStock || 0;
      const totalLowStock = response.totalLowStock || 0;
      const totalOutOfStock = response.totalOutOfStock || 0; */

      console.log("Total In Stock:", totalInStock);
      console.log("Total Low Stock:", totalLowStock);
      console.log("Total Out of Stock:", totalOutOfStock);

      res.json({
        pendingOrders,
        pendingCashToAdmin,
        ...response,
        conversionRate,
        averageOrderValue,
        totalInStock,
        totalLowStock,
        totalOutOfStock,
      });
    } catch (error) {
      console.error("Error in getTotalRevenue:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getRevenueTrend: async (req, res) => {
    try {
      console.log("api call to revenue trend", req.query);
      const response = await dashboardModels.getRevenueTrend(req.query);
      console.log("got revenue trend", response);
      res.json(response);
    } catch (error) {
      console.error("Error in getRevenueTrend:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getUserActivity: async (req, res) => {
    try {
      console.log("api call to user activity", req.query);
      const response = await dashboardModels.getUserActivity(req.query);
      console.log("user activity", response);
      res.json(response);
    } catch (error) {
      console.error("Error in getUserActivity:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getTotalOrders: async (req, res) => {
    try {
      console.log("api call to total orders");
      const orders = await dashboardModels.getOrders();
      console.log("orders is", orders);
      res.json(orders);
    } catch (error) {
      console.error("Error in getTotalOrders:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getProductsCategory: async (req, res) => {
    try {
      console.log("API call to category products");
      const result = await dashboardModels.getCategoriesProducts();
      console.log("Products total by category:", result);
      res.json(result);
    } catch (error) {
      console.error("Error in getCategoriesProducts:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};
