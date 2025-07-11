const couponModel = require("../models/couponModel");

module.exports = {
  getAllCoupons: async (req, res) => {
    try {
      let response = await couponModel.getAllCoupons();
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error });
    }
  },
  deleteCoupon: async (req, res) => {
    try {
      let couponId = req.params.id;
      console.log("couponId", couponId);
      const response = await couponModel.deleteCoupon(couponId);
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({ error });
    }
  },
};
