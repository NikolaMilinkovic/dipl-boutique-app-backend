import mongoose, { Document, Model, Schema } from "mongoose";

export interface PurseDocument extends Document {
  active: boolean;
  category: string;
  colors: mongoose.Types.ObjectId[];
  createdAt: Date;
  description?: string;
  image: Image;
  name: string;
  price: number;
  stockType: string;
  supplier?: string;
  totalStock?: number;
  updatedAt: Date;
}

interface Image {
  imageName: string;
  uri: string;
}

const ImageSchema = new Schema<Image>({
  imageName: { required: [true, "Image Name is required"], type: String },
  uri: { required: [true, "Image is required"], type: String },
});

const PurseSchema = new Schema<PurseDocument>(
  {
    active: { default: true, type: Boolean },
    category: { required: [true, "Category is required"], type: String },
    colors: [{ ref: "PurseColor", type: Schema.Types.ObjectId }],
    description: { required: false, type: String },
    image: { required: true, type: ImageSchema },
    name: { required: [true, "Item name is required"], type: String },
    price: { required: [true, "Price is required"], type: Number },
    stockType: { required: [true, "Stock type is required"], type: String },
    supplier: { required: false, type: String },
    totalStock: { default: 0, required: false, type: Number },
  },
  { timestamps: true },
);

PurseSchema.index({ active: 1 });

const PurseModel: Model<PurseDocument> = mongoose.model<PurseDocument>("Purse", PurseSchema);

export default PurseModel;
