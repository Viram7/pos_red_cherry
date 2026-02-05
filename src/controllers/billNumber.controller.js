const Bill = require("../models/bill.model");

/**
 * GET NEXT BILL NUMBER
 */
exports.getNextBillNumber = async (req, res) => {
  try {
    const billNumber = await generateBillNumber();

    res.status(200).json({
      success: true,
      billNumber,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Bill number generator
 * Format: BR01-YYYYMMDD-0001
 */
async function generateBillNumber() {
  const lastBill = await Bill.findOne({})
    .sort({ createdAt: -1 })
    .select("billNumber")
    .lean();

  let nextNumber = 1;

  if (lastBill?.billNumber) {
    const parts = lastBill.billNumber.split("-");
    nextNumber = parseInt(parts[2], 10) + 1;
  }

  // keep TODAY's date (or you can keep last bill date if you want)
  const today = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");

  return `BR01-${today}-${String(nextNumber).padStart(4, "0")}`;
}


