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
    const lastSeq = parseInt(parts[2], 10);
    nextNumber = isNaN(lastSeq) ? 1 : lastSeq + 1;
  }

  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");

  return `BR01-${date}-${String(nextNumber).padStart(4, "0")}`;
}
