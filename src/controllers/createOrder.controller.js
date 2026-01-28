const Product = require("../models/product.model");
const DiscountScheme = require("../models/discount.model");
const Warehouse = require("../models/warehouse.model");




const Bill = require("../models/bill.model");

async function generateBillNumber() {
  // 1. get latest bill
  const lastBill = await Bill.findOne({})
    .sort({ createdAt: -1 })
    .select("billNumber")
    .lean();

  let nextNumber = 1;

  if (lastBill && lastBill.billNumber) {
    // Example billNumber: BR01-20260117-0007
    const parts = lastBill.billNumber.split("-");
    const lastSeq = parseInt(parts[2], 10);
    nextNumber = lastSeq + 1;
  }

  const today = new Date();
  const date = today.toISOString().slice(0, 10).replace(/-/g, "");

  return `BR01-${date}-${String(nextNumber).padStart(4, "0")}`;
}



/**
 * APPLY DISCOUNT
 */
const applyDiscount = (price, qty, discountSchemes) => {
  const totalPrice = price * qty;
  let totalDiscount = 0;
  const now = new Date();

  discountSchemes.forEach((scheme) => {
    if (!scheme.isActive) return;
    if (now < scheme.validFrom || now > scheme.validTo) return;
    if (totalPrice < scheme.minPurchase) return;

    let discount = 0;

    // Flat discount
    if (scheme.maxDiscount) {
      discount = scheme.maxDiscount;
    }

    totalDiscount += discount;
  });

  return {
    totalPrice,
    totalDiscount,
    finalPrice: Math.max(totalPrice - totalDiscount, 0),
  };
};

/**
 * CREATE ORDER BY BARCODE
 */
exports.createOrderByBarcode = async (req, res) => {
  try {
    const { barcode, qty = 1 } = req.body;

    if (!barcode) {
      return res.status(400).json({ message: "Barcode is required" });
    }

    /**
     * 1️⃣ ACTIVE WAREHOUSE
     */
    const activeWarehouse = await Warehouse.findOne({
      createdBy: req.user._id,
      active: true,
    });

    if (!activeWarehouse) {
      return res.status(400).json({
        message: "No active warehouse found",
      });
    }

    /**
     * 2️⃣ PRODUCT FROM ACTIVE WAREHOUSE
     */
    const product = await Product.findOne({
      _id: { $in: activeWarehouse.products },
      "variants.barcodefield": barcode,
    })
      .populate("category")
      .populate("brand");

    if (!product) {
      return res.status(404).json({
        message: "Product not found in active warehouse",
      });
    }

    /**
     * 3️⃣ VARIANT WITH STOCK
     */
    const variant = product.variants.find(
      (v) => v.barcodefield.includes(barcode) && v.quantity >= qty
    );

    if (!variant) {
      return res.status(404).json({
        message: "Variant not found or insufficient stock",
      });
    }

    /**
     * 4️⃣ ACTIVE DISCOUNTS (WAREHOUSE ONLY)
     */
    const discountSchemes = await DiscountScheme.find({
      _id: { $in: activeWarehouse.discounts },
      isActive: true,
      validFrom: { $lte: new Date() },
      validTo: { $gte: new Date() },
      $or: [
        { categories: product.category._id },
        { brands: product.brand._id },
        { models: product.sku },
        { variants: variant.variantSku },
      ],
    });

    /**
     * 5️⃣ APPLY DISCOUNT
     */
    const { totalPrice, totalDiscount, finalPrice } =
      applyDiscount(variant.price, qty, discountSchemes);

    /**
     * 6️⃣ RESPONSE
     */
    // const billNumber = await generateBillNumber();
    res.json({
      productId: product._id,
      productName: product.name,
      barcodefieldName : product.barcodefieldName,
      // billNumber : billNumber,
      barcode: barcode,
      sku: product.sku,
      variantSku: variant.variantSku,
      quantity: qty,
      unitPrice: variant.price,
      totalPrice,
      discount: totalDiscount,
      finalPrice,
      warehouse: {
        id: activeWarehouse._id,
        name: activeWarehouse.name,
      },
      appliedDiscounts: discountSchemes.map((d) => ({
        id: d._id,
        name: d.name,
      })),
      variantFields: variant.fields,
      productFields: product.productFields,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
};
