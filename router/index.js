const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const deliveryController = require("../controllers/deliveryController");
const userControllers = require("../controllers/userControllers");
const dashboardController = require("../controllers/dashboardController");
const productController = require("../controllers/productController");
const userDisplayController = require("../controllers/userDisplayController");

const uploadSlider = require("../utils/multer");
const superAdminController = require("../controllers/superAdminController");
const couponController = require("../controllers/couponController");

router.get("/", (req, res) => {
  res.send("Welcome");
});

router.post("/login", superAdminController.login);

router.post("/create-admin", adminController.createAdmin);
router.post("/create-delivery", deliveryController.createDelivery);
router.get("/get-all-admins", adminController.getAllAdmins);
router.get("/get-all-deliveries", deliveryController.getAllDeliveries);

router.get("/all-users", userControllers.getAllUsers);

router.get("/get-merchant-requests",adminController.getMerchantRequests);
router.post("/approve-merchant", adminController.approveMerchant);

router.put("/block-admin/:id", adminController.blockAdmin);
router.put("/block-delivery/:id", deliveryController.blockDelivery);

router.put("/unblock-admin/:id", adminController.unBlockAdmin);
router.put("/unblock-delivery/:id", deliveryController.unBlockDelivery);

router.delete("/delete-admin/:id", adminController.deleteAdmin);
router.delete("/delete-delivery/:id", deliveryController.deleteDelivery);

router.get("/order-list/:userId", userControllers.getOrderList);
router.get("/ordered-products/:orderId", userControllers.getOrderedProducts);

router.get("/get-total-revenue", dashboardController.getTotalRevenue);
router.get("/get-revenue-trend", dashboardController.getRevenueTrend);
router.get("/get-user-activity", dashboardController.getUserActivity);
router.get("/get-products-category", dashboardController.getProductsCategory);

router.get("/get-all-products", productController.getAllProducts);
router.get('/get-product/:id', productController.getProductById);

router.post("/block-product/:id", productController.blockProduct);
router.post("/unblock-product/:id", productController.unBlockProduct);


router.get("/get-categoriesList", productController.getCategoriesList);


router.get("/get-total-orders", userControllers.getTotalOrders);

router.get('/get-categories',userDisplayController.getCategories)
router.post('/add-categories', userDisplayController.addCategories);

router.post('/delete-category', userDisplayController.deleteCategory);
router.delete('/delete-coupon/:id',couponController.deleteCoupon)


router.get("/get-all-coupons",couponController.getAllCoupons)


router.get("/get-sliders", userDisplayController.getSliders);
router.post("/add-slider", uploadSlider.single("image"), userDisplayController.addSlider);
router.post("/delete-slider", userDisplayController.deleteSlider);



router.post("/forgot-password", superAdminController.forgotPassword);
router.post("/verify-otp", superAdminController.verifyOtp);
router.post("/reset-password", superAdminController.resetPassword);

module.exports = router; 
