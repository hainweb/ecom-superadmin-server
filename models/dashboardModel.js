const collection = require("../lib/collections");
const db = require("../lib/connection");
const { ObjectId } = require("mongodb");
// Dashboard model for handling dashboard-related database operations

module.exports = {
  getProducts: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray()
        .then((products) => {
          resolve(products);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getTotalRevenue: () => {
    return new Promise((resolve, reject) => {
      // Order-level aggregation (without $unwind) that calculates order-level totals
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          // Stage 1: Add computed fields for each order
          {
            $addFields: {
              totalOrderedProducts: { $sum: "$products.quantity" },
              orderReturnedProducts: {
                $size: {
                  $filter: {
                    input: "$products",
                    as: "p",
                    cond: {
                      $eq: [{ $ifNull: ["$$p.return.status", false] }, true],
                    },
                  },
                },
              },
            },
          },
          // Stage 2: Group all orders to compute overall statistics
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalRevenue: { $sum: { $toInt: "$total" } },
              totalOrderedProducts: { $sum: "$totalOrderedProducts" },
              deliveredOrders: {
                $sum: {
                  $cond: [{ $eq: ["$status3", "Product delivered"] }, 1, 0],
                },
              },
              deliveredRevenue: {
                $sum: {
                  $cond: [
                    { $eq: ["$status3", "Product delivered"] },
                    { $toInt: "$total" },
                    0,
                  ],
                },
              },
              canceledOrders: {
                $sum: {
                  $cond: [{ $eq: ["$cancel", true] }, 1, 0],
                },
              },
              // Sum the computed returned products count
              returnedProducts: { $sum: "$orderReturnedProducts" },
              cashToAdminOrders: {
                $sum: {
                  $cond: [{ $eq: ["$cashadmin", "Cash sended"] }, 1, 0],
                },
              },
              // Calculate the pending amount to admin by summing orders that are delivered
              // but not yet marked as "Cash sended"
              pendingAmountToAdmin: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$status3", "Product delivered"] },
                        { $ne: ["$cashadmin", "Cash sended"] },
                      ],
                    },
                    { $toInt: "$total" },
                    0,
                  ],
                },
              },
            },
          },
          { $project: { _id: 0 } }, // Remove _id field from the output
        ])
        .toArray()
        .then((orderStats) => {
          // Category-wise aggregation (with $unwind) to get product-level details
          db.get()
            .collection(collection.ORDER_COLLECTION)
            .aggregate([
              { $unwind: "$products" },
              {
                $group: {
                  _id: "$products.product.Category",
                  totalOrders: { $sum: 1 },
                  totalOrderedProducts: { $sum: "$products.quantity" },
                  deliveredRevenue: {
                    $sum: {
                      $cond: [
                        { $eq: ["$status3", "Product delivered"] },
                        {
                          $multiply: [
                            { $toInt: "$products.product.Price" },
                            "$products.quantity",
                          ],
                        },
                        0,
                      ],
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  category: "$_id",
                  totalOrders: 1,
                  totalOrderedProducts: 1,
                  deliveredRevenue: 1,
                },
              },
              {
                $group: {
                  _id: null,
                  categoryWiseStats: {
                    $push: {
                      category: "$category",
                      totalOrders: "$totalOrders",
                      totalOrderedProducts: "$totalOrderedProducts",
                      deliveredRevenue: "$deliveredRevenue",
                    },
                  },
                },
              },
              { $project: { _id: 0, categoryWiseStats: 1 } },
            ])
            .toArray()
            .then((categoryStats) => {
              // Count total users from the USER_COLLECTION
              db.get()
                .collection(collection.USER_COLLECTION)
                .countDocuments()
                .then((userCount) => {
                  // Merge all results into one final result object
                  const result = {
                    ...orderStats[0],
                    totalUser: userCount,
                    ...categoryStats[0],
                  };
                  return resolve(result);
                })
                .catch((err) => reject(err));
            })
            .catch((err) => reject(err));
        })
        .catch((err) => reject(err));
    });
  },

  getRevenueTrend: (filter) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Destructure the provided filter object.
        const { year, dateRange } = filter;
        const today = new Date();
        let startDate, endDate;

        // Prepare the date boundaries based on the dateRange.
        if (dateRange === "Last 7 days") {
          // Last 7 days: today and the previous 6 days.
          endDate = today;
          startDate = new Date();
          startDate.setDate(today.getDate() - 6);
        } else if (dateRange === "Last 30 days") {
          // Last 30 days: today and the previous 29 days.
          endDate = today;
          startDate = new Date();
          startDate.setDate(today.getDate() - 29);
        } else if (dateRange === "In this year") {
          // Use the passed year to get the full year range.
          startDate = new Date(`${year}-01-01T00:00:00Z`);
          endDate = new Date(`${year}-12-31T23:59:59Z`);
        } else {
          // If none of the expected dateRange strings, you could set defaults.
          startDate = new Date(0);
          endDate = today;
        }

        // Begin building the aggregation pipeline.
        // First, we match delivered orders and convert the string date field
        // into an actual Date as well as converting total to a double.
        const pipeline = [
          {
            $match: {
              status3: "Product delivered",
            },
          },
          {
            $addFields: {
              orderDate: {
                $dateFromString: {
                  dateString: {
                    $substr: ["$date", 0, { $indexOfBytes: ["$date", " at"] }],
                  },
                },
              },
              orderRevenue: { $toDouble: "$total" },
            },
          },
          // Filter only orders between startDate and endDate.
          {
            $match: {
              orderDate: { $gte: startDate, $lte: endDate },
            },
          },
        ];

        // Build further grouping/projection stages based on the dateRange.
        if (dateRange === "Last 7 days") {
          pipeline.push(
            // Group orders by day of week and sum revenue
            {
              $group: {
                _id: { dayOfWeek: { $dayOfWeek: "$orderDate" } },
                revenue: { $sum: "$orderRevenue" },
              },
            },
            {
              $project: {
                _id: 0,
                dayOfWeek: "$_id.dayOfWeek",
                revenue: 1,
              },
            },
            // Combine the actual results with a default array for all seven days.
            {
              $group: {
                _id: null,
                data: { $push: "$$ROOT" },
              },
            },
            {
              $project: {
                // The default array covers Sun (1) through Sat (7) with revenue: 0.
                data: {
                  $concatArrays: [
                    [
                      { dayOfWeek: 1, name: "Sun", revenue: 0 },
                      { dayOfWeek: 2, name: "Mon", revenue: 0 },
                      { dayOfWeek: 3, name: "Tue", revenue: 0 },
                      { dayOfWeek: 4, name: "Wed", revenue: 0 },
                      { dayOfWeek: 5, name: "Thu", revenue: 0 },
                      { dayOfWeek: 6, name: "Fri", revenue: 0 },
                      { dayOfWeek: 7, name: "Sat", revenue: 0 },
                    ],
                    "$data",
                  ],
                },
              },
            },
            { $unwind: "$data" },
            // Group again by dayOfWeek so that if any revenue exists it will be summed over the default (zero) value.
            {
              $group: {
                _id: "$data.dayOfWeek",
                name: { $first: "$data.name" },
                value: { $sum: "$data.revenue" },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                _id: 0,
                name: 1,
                value: 1,
              },
            }
          );
        } else if (dateRange === "Last 30 days") {
          pipeline.push(
            // Group by day of month
            {
              $group: {
                _id: { day: { $dayOfMonth: "$orderDate" } },
                revenue: { $sum: "$orderRevenue" },
              },
            },
            {
              $project: {
                _id: 0,
                day: "$_id.day",
                revenue: 1,
              },
            },
            // Combine with a default array for days 1 through 31.
            {
              $group: {
                _id: null,
                data: { $push: "$$ROOT" },
              },
            },
            {
              $project: {
                data: {
                  $concatArrays: [
                    [
                      { day: 1, name: "1", revenue: 0 },
                      { day: 2, name: "2", revenue: 0 },
                      { day: 3, name: "3", revenue: 0 },
                      { day: 4, name: "4", revenue: 0 },
                      { day: 5, name: "5", revenue: 0 },
                      { day: 6, name: "6", revenue: 0 },
                      { day: 7, name: "7", revenue: 0 },
                      { day: 8, name: "8", revenue: 0 },
                      { day: 9, name: "9", revenue: 0 },
                      { day: 10, name: "10", revenue: 0 },
                      { day: 11, name: "11", revenue: 0 },
                      { day: 12, name: "12", revenue: 0 },
                      { day: 13, name: "13", revenue: 0 },
                      { day: 14, name: "14", revenue: 0 },
                      { day: 15, name: "15", revenue: 0 },
                      { day: 16, name: "16", revenue: 0 },
                      { day: 17, name: "17", revenue: 0 },
                      { day: 18, name: "18", revenue: 0 },
                      { day: 19, name: "19", revenue: 0 },
                      { day: 20, name: "20", revenue: 0 },
                      { day: 21, name: "21", revenue: 0 },
                      { day: 22, name: "22", revenue: 0 },
                      { day: 23, name: "23", revenue: 0 },
                      { day: 24, name: "24", revenue: 0 },
                      { day: 25, name: "25", revenue: 0 },
                      { day: 26, name: "26", revenue: 0 },
                      { day: 27, name: "27", revenue: 0 },
                      { day: 28, name: "28", revenue: 0 },
                      { day: 29, name: "29", revenue: 0 },
                      { day: 30, name: "30", revenue: 0 },
                      { day: 31, name: "31", revenue: 0 },
                    ],
                    "$data",
                  ],
                },
              },
            },
            { $unwind: "$data" },
            // Group again by the day number to sum revenue if actual orders exist.
            {
              $group: {
                _id: "$data.day",
                name: { $first: "$data.name" },
                value: { $sum: "$data.revenue" },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                _id: 0,
                name: 1,
                value: 1,
              },
            }
          );
        } else if (dateRange === "In this year") {
          // Group by month.
          pipeline.push(
            {
              $group: {
                _id: { month: { $month: "$orderDate" } },
                revenue: { $sum: "$orderRevenue" },
              },
            },
            {
              $project: {
                _id: 0,
                monthIndex: "$_id.month",
                value: "$revenue",
              },
            },
            // Merge the grouped revenue with an array of all 12 months (defaulting missing months to zero).
            {
              $group: {
                _id: null,
                revenueData: { $push: "$$ROOT" },
              },
            },
            {
              $project: {
                _id: 0,
                revenueData: {
                  $concatArrays: [
                    [
                      { monthIndex: 1, name: "Jan", value: 0 },
                      { monthIndex: 2, name: "Feb", value: 0 },
                      { monthIndex: 3, name: "Mar", value: 0 },
                      { monthIndex: 4, name: "Apr", value: 0 },
                      { monthIndex: 5, name: "May", value: 0 },
                      { monthIndex: 6, name: "Jun", value: 0 },
                      { monthIndex: 7, name: "Jul", value: 0 },
                      { monthIndex: 8, name: "Aug", value: 0 },
                      { monthIndex: 9, name: "Sep", value: 0 },
                      { monthIndex: 10, name: "Oct", value: 0 },
                      { monthIndex: 11, name: "Nov", value: 0 },
                      { monthIndex: 12, name: "Dec", value: 0 },
                    ],
                    "$revenueData",
                  ],
                },
              },
            },
            { $unwind: "$revenueData" },
            {
              $group: {
                _id: "$revenueData.monthIndex",
                name: { $first: "$revenueData.name" },
                value: { $sum: "$revenueData.value" },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                _id: 0,
                name: 1,
                value: 1,
              },
            }
          );
        }

        // Execute the aggregation.
        const result = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .aggregate(pipeline)
          .toArray();

        console.log("Processed results:", result);
        resolve(result);
      } catch (error) {
        console.error("Error in revenue trend:", error);
        reject(error);
      }
    });
  },

  getUserActivity: (date) => {
    console.log("Received date:", date);

    return new Promise((resolve, reject) => {
      // If a date range is provided from the frontend, use it.
      // Otherwise, use the default logic (latest 7 days).
      let startDate, endDate;

      if (date && date.start && date.end) {
        startDate = new Date(date.start);
        endDate = new Date(date.end);
      } else {
        // Get the current date in UTC
        const now = new Date();

        // Get the current day in UTC (0 = Sunday, ..., 6 = Saturday)
        const day = now.getUTCDay();

        // Calculate Monday (start of the week)
        const diffToMonday = day === 0 ? -6 : 1 - day; // Adjust for UTC week start
        const monday = new Date(now);
        monday.setUTCDate(now.getUTCDate() + diffToMonday);
        monday.setUTCHours(0, 0, 0, 0); // Start of Monday

        // Calculate Sunday (end of the week)
        const sunday = new Date(monday);
        sunday.setUTCDate(monday.getUTCDate() + 6);
        sunday.setUTCHours(23, 59, 59, 999); // End of Sunday

        startDate = monday;
        endDate = sunday;

        console.log("Start date (UTC):", startDate.toISOString());
        console.log("End date (UTC):", endDate.toISOString());
      }

      console.log(
        "Using date range:",
        startDate.toISOString().split("T")[0],
        "to",
        endDate.toISOString().split("T")[0]
      );

      db.get()
        .collection(collection.USER_COLLECTION)
        .aggregate([
          {
            $facet: {
              createdAtCounts: [
                {
                  $addFields: {
                    dayOfWeek: { $dayOfWeek: { $toDate: "$CreatedAt" } },
                    createdDate: { $toDate: "$CreatedAt" },
                  },
                },
                {
                  $match: {
                    createdDate: {
                      $gte: startDate,
                      $lte: endDate,
                    },
                  },
                },
                {
                  $group: {
                    _id: {
                      dayOfWeek: "$dayOfWeek",
                      date: {
                        $dateToString: {
                          format: "%Y-%m-%d",
                          date: "$createdDate",
                        },
                      },
                    },
                    new: { $sum: 1 },
                  },
                },
              ],
              lastActiveCounts: [
                {
                  $addFields: {
                    dayOfWeek: { $dayOfWeek: { $toDate: "$LastActive" } },
                    lastActiveDate: { $toDate: "$LastActive" },
                  },
                },
                {
                  $match: {
                    lastActiveDate: {
                      $gte: startDate,
                      $lte: endDate,
                    },
                  },
                },
                {
                  $group: {
                    _id: {
                      dayOfWeek: "$dayOfWeek",
                      date: {
                        $dateToString: {
                          format: "%Y-%m-%d",
                          date: "$lastActiveDate",
                        },
                      },
                    },
                    active: { $sum: 1 },
                  },
                },
              ],
              returningUsers: [
                {
                  $addFields: {
                    lastActiveDate: { $toDate: "$LastActive" },
                    createdDate: { $toDate: "$CreatedAt" },
                  },
                },
                {
                  $match: {
                    lastActiveDate: { $gte: startDate, $lte: endDate }, // User is active in the selected range
                    createdDate: { $lt: "$lastActiveDate" }, // User existed before last activity
                  },
                },
                {
                  $addFields: {
                    inactivePeriod: {
                      $subtract: [
                        "$lastActiveDate",
                        { $toDate: "$LastActive" },
                      ],
                    },
                  },
                },
                {
                  $match: {
                    inactivePeriod: { $gte: 1000 * 60 * 60 * 24 * 14 }, // Inactive for at least 14 days
                  },
                },
                {
                  $group: {
                    _id: {
                      dayOfWeek: { $dayOfWeek: "$lastActiveDate" },
                      date: {
                        $dateToString: {
                          format: "%Y-%m-%d",
                          date: "$lastActiveDate",
                        },
                      },
                    },
                    returning: { $sum: 1 },
                  },
                },
              ],
            },
          },
          {
            $project: {
              allStats: {
                $map: {
                  input: [
                    { dayNum: 2, name: "Mon" },
                    { dayNum: 3, name: "Tue" },
                    { dayNum: 4, name: "Wed" },
                    { dayNum: 5, name: "Thu" },
                    { dayNum: 6, name: "Fri" },
                    { dayNum: 7, name: "Sat" },
                    { dayNum: 1, name: "Sun" },
                  ],
                  as: "day",
                  in: {
                    name: "$$day.name",
                    date: {
                      $let: {
                        vars: {
                          matchingDate: {
                            $first: {
                              $filter: {
                                input: "$lastActiveCounts",
                                as: "la",
                                cond: {
                                  $eq: ["$$la._id.dayOfWeek", "$$day.dayNum"],
                                },
                              },
                            },
                          },
                        },
                        in: {
                          $ifNull: ["$$matchingDate._id.date", null],
                        },
                      },
                    },
                    active: {
                      $let: {
                        vars: {
                          matchingActive: {
                            $filter: {
                              input: "$lastActiveCounts",
                              as: "act",
                              cond: {
                                $eq: ["$$act._id.dayOfWeek", "$$day.dayNum"],
                              },
                            },
                          },
                        },
                        in: {
                          $ifNull: [{ $first: "$$matchingActive.active" }, 0],
                        },
                      },
                    },
                    new: {
                      $let: {
                        vars: {
                          matchingNew: {
                            $filter: {
                              input: "$createdAtCounts",
                              as: "new",
                              cond: {
                                $eq: ["$$new._id.dayOfWeek", "$$day.dayNum"],
                              },
                            },
                          },
                        },
                        in: {
                          $ifNull: [{ $first: "$$matchingNew.new" }, 0],
                        },
                      },
                    },
                    returning: {
                      $let: {
                        vars: {
                          matchingReturning: {
                            $filter: {
                              input: "$returningUsers",
                              as: "ret",
                              cond: {
                                $eq: ["$$ret._id.dayOfWeek", "$$day.dayNum"],
                              },
                            },
                          },
                        },
                        in: {
                          $ifNull: [
                            { $first: "$$matchingReturning.returning" },
                            0,
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $unwind: "$allStats",
          },
          {
            $replaceRoot: { newRoot: "$allStats" },
          },
        ])
        .toArray()
        .then((result) => {
          // Return the results along with the date range used
          const response = {
            dateRange: {
              start: startDate.toISOString().split("T")[0],
              end: endDate.toISOString().split("T")[0],
            },
            data: result,
          };
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  getCategoriesProducts: () => {
    return new Promise((resolve, reject) => {
      console.log("Starting aggregation in getCategoriesProducts...");
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .aggregate([
          {
            $facet: {
              categories: [
                {
                  $group: {
                    _id: "$Category",
                    value: { $sum: 1 },
                    quantity: {
                      $sum: {
                        $convert: {
                          input: "$Quantity",
                          to: "int",
                          onError: 0,
                          onNull: 0,
                        },
                      },
                    },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    name: "$_id",
                    value: 1,
                    quantity: 1,
                  },
                },
              ],
              totals: [
                {
                  $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalQuantity: {
                      $sum: {
                        $convert: {
                          input: "$Quantity",
                          to: "int",
                          onError: 0,
                          onNull: 0,
                        },
                      },
                    },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    totalProducts: 1,
                    totalQuantity: 1,
                  },
                },
              ],
            },
          },
        ])
        .toArray()
        .then((result) => {
          const finalResult = {
            categories: result[0].categories,
            ...result[0].totals[0],
          };
          resolve(finalResult);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
};
