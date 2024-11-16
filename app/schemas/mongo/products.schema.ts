
import { Document, Schema, model } from 'mongoose';

export type ProductType = Document & {
  productAvatar?: string;
  productSku: string;
  productName: string;
  productUnitPrice: number;
  productQuantity: number;
  productCategory: "Medicine" | "Component";
  productDescription: string;
  vendorId: string;
  isDeleted?: boolean;
}

const productsSchema = new Schema<ProductType>(
  {
    productAvatar: { type: String, required: false },
    productSku: { type: String, required: true, unique: true },
    productName: { type: String, required: true },
    productUnitPrice: { type: Number, required: true },
    productQuantity: { type: Number, required: true },
    productCategory: { type: String, required: true },
    productDescription: { type: String, required: true },
    vendorId: { type: String, required: true, ref: 'vendors' },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

const ProductModel = model<ProductType>('products', productsSchema);
export default ProductModel;