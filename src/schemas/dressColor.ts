import mongoose, { Document, Model, Schema } from "mongoose";

export interface DressColorDocument extends Document {
  color: string;
  colorCode?: string;
  createdAt: Date;
  sizes: Size[];
  updatedAt: Date;
}

interface Size {
  _id?: mongoose.Types.ObjectId;
  size: string;
  stock: number;
}

const SizeSchema = new Schema<Size>({
  size: { required: true, type: String },
  stock: { default: 0, required: true, type: Number },
});

const DressColorSchema = new Schema<DressColorDocument>(
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
    sizes: [SizeSchema],
  },
  { timestamps: true },
);

const DressColorModel: Model<DressColorDocument> = mongoose.model<DressColorDocument>("DressColor", DressColorSchema);

export default DressColorModel;
