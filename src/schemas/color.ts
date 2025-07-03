import mongoose, { Document, Schema } from "mongoose";

export interface IColor extends Document {
  colorCode?: string;
  name: string;
}

const ColorSchema = new Schema<IColor>(
  {
    colorCode: {
      default: "",
      required: false,
      type: String,
    },
    name: {
      required: [true, "Please enter a valid color name"],
      type: String,
      unique: [true, "This color already exists"],
    },
  },
  { timestamps: true },
);

export default mongoose.model<IColor>("Color", ColorSchema);
