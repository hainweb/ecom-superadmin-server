const db = require("../lib/connection");
const collections = require("../lib/collections");
const { deleteCoupon } = require("../controllers/couponController");

const couponCollection = () =>
  db.get().collection(collections.COUPONS_COLLECTION);

module.exports = {
  getAllCoupons: async () => {
    try {
      const response = await couponCollection()
        .aggregate([
          {
            $unwind: "$coupons",
          },
          {
            $lookup: {
              from: collections.USER_COLLECTION,
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: "$user",
          },
          {
            $project: {
              _id: 0,
              code: "$coupons.code",
              discount: "$coupons.discount",
              minAmount: "$coupons.minAmount",
              expDate: "$coupons.expDate",
              isUsed: "$coupons.isUsed",
              userName: "$user.Name",
              userEmail: "$user.Email",
              userMobile: "$user.Mobile",
            },
          },
        ])
        .toArray();

      return response;
    } catch (error) {
      throw new Error(error);
    }
  },
  deleteCoupon: async (couponCode) => {
    try {
      const response = await couponCollection().updateOne(
        {
          "coupons.code": couponCode,
        },

        {
          $pull: { coupons: {code:couponCode }},
        }
      );

      console.log(response);

      if(response.modifiedCount>0){
        return {status:true}
      }
      return {status:false}
    } catch (error) {
        console.error(error);
        
      throw new Error("Error in deleting coupons", error);
    }
  },
};
