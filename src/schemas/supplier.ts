import mongoose, { Document, Schema } from "mongoose";

interface SupplierDocument extends Document {
  name: string;
}

const SupplierSchema = new Schema<SupplierDocument>(
  {
    name: {
      required: [true, "Supplier name is required."],
      type: String,
    },
  },
  { timestamps: true },
);

export default mongoose.model<SupplierDocument>("Supplier", SupplierSchema);
