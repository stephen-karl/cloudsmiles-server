
import { Document, Schema, model } from 'mongoose';

type ItemType = Document & {
  itemAppointmentId: Schema.Types.ObjectId;
  itemCheckupId: Schema.Types.ObjectId;
  itemTreatmentId: Schema.Types.ObjectId;
  itemPrice: number;
  itemQuantity: number;
}

const itemSchema = new Schema<ItemType>(
  {
    itemAppointmentId: { type: Schema.Types.ObjectId, required: true, ref: "appointments" },
    itemCheckupId: { type: Schema.Types.ObjectId, required: true, ref: "checkups" },
    itemTreatmentId: { type: Schema.Types.ObjectId, required: true, ref: "treatments" },
    itemPrice: { type: Number, required: true },
    itemQuantity: { type: Number, required: true },
  },
  {
    timestamps: true,
  },
);

const ItemModel = model<ItemType>('items', itemSchema);
export default ItemModel;