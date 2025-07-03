import mongoose, { Document, model, Schema } from "mongoose";

export interface CourierDocument extends Document {
  deliveryPrice: number;
  name: string;
}

const CourierSchema = new Schema<CourierDocument>(
  {
    deliveryPrice: {
      required: [true, "Please provide a delivery price"],
      type: Number,
    },
    name: {
      required: [true, "Please provide a courier name"],
      type: String,
      unique: true,
    },
  },
  { timestamps: true },
);

export default model<CourierDocument>("Courier", CourierSchema);
