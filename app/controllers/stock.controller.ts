import { imageUploader } from "../helpers/cloudinary/uploader";
import { Request, Response } from "express";
import { imageDeleter } from "../helpers/cloudinary/deleter";
import { sendPurchaseOrderEmail } from "../helpers/resend/transporters";
import OrderModel, { OrderResponseType, OrderType, ProductOrderType } from "../schemas/mongo/order.schema";
import ProductModel, { ProductType } from "../schemas/mongo/products.schema";
import vendorModel from "../schemas/mongo/vendors.schema";

export const validateSku = async (req: Request, res: Response) => {
  try {
    const ifSkuExists = await ProductModel.findOne({ productSku: req.params.sku });
    if (ifSkuExists) {
      return res.status(400).json({ message: "SKU already exists" });
    }
    res.status(200).json({ message: "SKU is valid" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const findvendors = async (req: Request, res: Response) => {
  try {
    const keywords = req.params.keywords as string;
    const vendors = await vendorModel.find({
      $or: [
        { vendorCompanyName: { $regex: keywords, $options: 'i' } },
        { vendorContactPerson: { $regex: keywords, $options: 'i' } },
      ]
    });

    if (!vendors) {
      return res.status(201).json({ message: "No vendors found" });
    }

    res.status(200).json(vendors);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const getVendors = async (req: Request, res: Response) => {
  try {
    const vendors = await vendorModel.find();
    res.status(200).json(vendors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const findProducts = async (req: Request, res: Response) => {
  try {
    const keywords = req.params.keywords as string;
    const products = await ProductModel.find({
      $or: [
        { productName: { $regex: keywords, $options: 'i' } },
      ]
    });

    if (!products) {
      return res.status(201).json({ message: "No products found" });
    }

    res.status(200).json(products);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const createProduct = async (req: Request, res: Response) => {

  try {
    const sku = req.body.productSku;
    req.body.productAvatar = "";
    const productResponse = await ProductModel.create(req.body)
    if (req.file) {
      const cloudinaryResponse = await imageUploader(
        req.file.buffer, 
        req.file.mimetype, 
        'products', 
        sku, 
        300, 300
      );
      req.body.productAvatar = cloudinaryResponse.secure_url;
      const productAvatar = req.body.productAvatar;
      await ProductModel.findByIdAndUpdate(productResponse._id, { productAvatar }, { new: true });
    }

    res.status(200).json("Product created");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const getProducts = async (req: Request, res: Response) => {

  try {
    const products = await ProductModel
    .find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .populate('vendorId');
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const getStocks = async (req: Request, res: Response) => {

  try {

    const inStock = await ProductModel.countDocuments({ productQuantity: { $gt: 15 } });
    const lowStock = await ProductModel.countDocuments({ productQuantity: { $gt: 0, $lte: 15 } });
    const outOfStock = await ProductModel.countDocuments({ productQuantity: { $eq: 0 } });
    const totalProducts = await ProductModel.countDocuments();

    const totalCostResult = await ProductModel.aggregate([
      {
        $project: {
          totalCost: { $multiply: ["$productUnitPrice", "$productQuantity"] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalCost" }
        }
      }
    ]);

    const totalAssetValue = totalCostResult.length > 0 ? totalCostResult[0].total : 0;

    const stocks = [
      { status: "In stock", value: inStock },
      { status: "Low stock", value: lowStock },
      { status: "Out of stock", value: outOfStock },
    ]
 
    res.status(200).json({ totalAssetValue, totalProducts, stocks, });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const deleteProduct = async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    await ProductModel.findByIdAndUpdate(id, { isDeleted: true });
    
    res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting product" });
  }
}

export const editProduct = async (req: Request, res: Response) => {
  try {
    const sku = req.body.productSku;
    if (req.file) {
      await imageDeleter('products', sku as string);
      const cloudinaryResponse = await imageUploader(
        req.file.buffer, 
        req.file.mimetype, 
        'products', 
        req.body._id as string,
        300,
        300
      );
      req.body.productAvatar = cloudinaryResponse.secure_url;
    }
    // Remove
    if (req.body.productAvatar === 'null') {
      await imageDeleter('products', sku as string);
      req.body.productAvatar = ""
    }

    const productResult = await ProductModel.findByIdAndUpdate(req.body._id, req.body, { new: true });
    res.status(200).json(productResult);
  } catch (error) {
    res.status(400).json(error)
  }
}


export const createOrder = async (req: Request, res: Response) => {
  try {
    const orderResponse = await OrderModel.create(req.body)


    if (req.body.orderSendEmail) {
      const order = await OrderModel
      .findById(orderResponse._id)
      .populate('orderProducts.productId')
      .populate('orderVendorId') as unknown as OrderResponseType
  
      if (!order) {
        return res.status(400).json({ message: "Order not found" });
      }

      await sendPurchaseOrderEmail(order);
    }

    res.status(200).json("Order created");
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export const getOrders = async (req: Request, res: Response) => {
  try {
    const orders = await OrderModel.find()
    .populate('orderVendorId')
    .populate('orderProducts.productId')
    .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

export const receiveOrder = async (req: Request, res: Response) => {
  try {
    const { orderId, orderProducts, orderStatus } = req.body;

    // Get the previous products in the order for reference
    const oldOrder = await OrderModel.findById(orderId, { orderProducts: 1 }) as OrderType;

    if (!oldOrder) {
      return res.status(400).json({
        message: `Order with ID ${orderId} not found`
      });
    }

    // Update each product quantity based on the new order
    for (const product of orderProducts) {
      const { productId, productQuantity, productReceived } = product;
    
      const existingProduct = await ProductModel.findById(productId) as ProductType;
    
      if (!existingProduct) {
        return res.status(400).json({
          message: `Product with ID ${productId} not found in the order`
        });
      }


      const oldProductOrder = oldOrder.orderProducts.find((oldProduct) => oldProduct.productId.toString() === productId)
      const oldProductReceived = oldProductOrder ? oldProductOrder.productReceived : 0


      let newQuantity = existingProduct.productQuantity;

      if (productReceived > oldProductReceived) {
        const receivedDifference = productReceived - oldProductReceived;
        newQuantity += receivedDifference;
      } else {
        const receivedDifference = oldProductReceived - productReceived;
        newQuantity -= receivedDifference;
      }
      // Update product stock in the database
      await ProductModel.findByIdAndUpdate(
        productId,
        { productQuantity: newQuantity }, 
        { new: true }
      );
    }
    

    // Update the order with new status and products
    const orderResponse = await OrderModel.findByIdAndUpdate(
      orderId,
      {
        orderStatus,
        orderProducts,
      },
      { new: true }
    );

    res.status(200).json(orderResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  const orderId = req.params.id;
  try {

    const oldOrder = await OrderModel.findById(orderId, { orderProducts: 1 }) as OrderType;

    const filteredRemovedProducts = oldOrder.orderProducts

    if (filteredRemovedProducts.length > 0) {
      for (const product of filteredRemovedProducts) {
        const { productId, productReceived } = product;
        const existingProduct = await ProductModel.findById(productId) as ProductType;
        const newQuantity = existingProduct.productQuantity - productReceived;
        await ProductModel.findByIdAndUpdate(
          productId,
          { productQuantity: newQuantity },
          { new: true }
        )
      }
    }
    await OrderModel.findByIdAndDelete(orderId);
    res.status(200).json({ message: "Order deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting product" });
  }
}

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { orderId, orderProducts } = req.body;

    const oldOrder = await OrderModel.findById(orderId, { orderProducts: 1 }) as OrderType;

    const missingProducts = oldOrder.orderProducts.filter((oldProduct) => {
      const doesntExist = orderProducts.every((newProduct: ProductOrderType) => newProduct.productId.toString() !== oldProduct.productId.toString());
      return doesntExist;
    })
    
    const filteredRemovedProducts = missingProducts.map((productOrder: ProductOrderType) => ({
      productId: productOrder.productId,
      productReceived: productOrder.productReceived,
    }));

    if (filteredRemovedProducts.length > 0) {
      for (const product of filteredRemovedProducts) {
        const { productId, productReceived } = product;
        const existingProduct = await ProductModel.findById(productId) as ProductType;
        const newQuantity = existingProduct.productQuantity - productReceived;
        await ProductModel.findByIdAndUpdate(
          productId,
          { productQuantity: newQuantity },
          { new: true }
        )
      }
    }

    await OrderModel.findByIdAndUpdate(
      orderId,
      req.body,
      { new: true }
    ) 

    if (req.body.orderSendEmail) {
      const order = await OrderModel
      .findById(orderId)
      .populate('orderProducts.productId')
      .populate('orderVendorId') as unknown as OrderResponseType
  
      if (!order) {
        return res.status(400).json({ message: "Order not found" });
      }

      await sendPurchaseOrderEmail(order);
    }
    

    res.status(200).json("Order updated");
  } catch (error) {
    res.status(500).json(error)
  }
}