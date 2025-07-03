import mongoose, { Document, Model, Schema } from "mongoose";

export interface PurseColorDocument extends Document {
  color: string;
  colorCode?: string;
  createdAt: Date;
  stock: number;
  updatedAt: Date;
}

const PurseColorSchema = new Schema<PurseColorDocument>(
  {
    color: {
      required: [true, "Please enter a valid color"],
      type: String,
      unique: false,
    },
    colorCode: {
      required: false,
      type: String,
    },
    stock: {
      default: 0,
      required: true,
      type: Number,
    },
  },
  { timestamps: true },
);

const PurseColorModel: Model<PurseColorDocument> = mongoose.model<PurseColorDocument>("PurseColor", PurseColorSchema);

export default PurseColorModel;
