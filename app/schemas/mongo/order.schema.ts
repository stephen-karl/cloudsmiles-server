import { Document, Types, Schema, model } from 'mongoose';
import CounterModel from './counter.schema';
import { VendorType } from './vendors.schema';
import { ProductType } from './products.schema';

export type ProductOrderType = {
  productId: string;
  productQuantity: number;
  productStatus: string;
  productReceived: number;
}

export type ProductOrderResponseType = {
  productId: ProductType
  productQuantity: number;
  productStatus: string;
  productReceived: number;
}

export type OrderType = Document & {
  orderVendorId: Types.ObjectId;
  orderProducts: ProductOrderType[];
  orderNotes?: string;
  orderSendEmail: boolean;
  orderSerialId?: string;
  orderStatus: string;
}

export type OrderResponseType = {
  _id: string;
  orderVendorId: VendorType;
  orderProducts: ProductOrderResponseType[];
  orderNotes: string;
  orderSendEmail: boolean;
  orderSerialId: string;
  orderStatus: string;
  createdAt: string;
}

const orderSchema = new Schema<OrderType>(
  {
    orderVendorId: { type: Schema.Types.ObjectId, ref: 'vendors' },
    orderProducts: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'products' },
        productQuantity: { type: Number, required: true },
        productStatus: { type: String, default: 'pending' },
        productReceived: { type: Number, default: 0 },
      },
    ],
    orderNotes: { type: String, default: '', required: false },
    orderSendEmail: { type: Boolean, default: false },
    orderSerialId: { type: String, required: false },
    orderStatus: { type: String, default: 'pending' },
  },

  {
    timestamps: true,
  },
);

orderSchema.pre('save', async function (next) {
  const doc = this;
  if (doc.isNew) {
    const counter = await CounterModel.findOneAndUpdate(
      { sequenceName: 'order_sequence' },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    doc.orderSerialId = `ORDR${counter.count.toString().padStart(5, '0')}`;
  }
  next();
});

const OrderModel = model<OrderType>('orders', orderSchema);
export default OrderModel