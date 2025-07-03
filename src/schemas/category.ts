import mongoose, { Document, Model, Schema } from "mongoose";

export interface CategoryDocument extends Document {
  createdAt: Date;
  name: string;
  stockType: string;
  updatedAt: Date;
}

const CategorySchema = new Schema<CategoryDocument>(
  {
    name: {
      required: [true, "Please provide a category name"],
      type: String,
      unique: true,
    },
    stockType: {
      required: [true, "Please provide a stock type"],
      type: String,
    },
  },
  { timestamps: true },
);

const Category: Model<CategoryDocument> = mongoose.model<CategoryDocument>("Category", CategorySchema);

export default Category;
