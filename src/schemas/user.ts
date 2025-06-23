import { ObjectId } from "mongodb";
import mongoose, { Document, Model, Schema } from "mongoose";

export interface UserTypes extends Document {
  _id: ObjectId;
  password: string;
  permissions?: Record<string, unknown>;
  role: string;
  settings?: {
    defaults: {
      courier?: string;
      listProductsBy?: string;
    };
  };
  username: string;
}

const UserSchema = new Schema<UserTypes>(
  {
    password: {
      required: [true, "Please enter a valid password"],
      type: String,
    },
    permissions: {
      default: {},
      type: Object,
    },
    role: {
      default: "admin",
      required: true,
      type: String,
    },
    settings: {
      defaults: {
        courier: { default: "", type: String },
        listProductsBy: { default: "category", type: String },
      },
    },
    username: {
      required: [true, "Please enter a valid username"],
      type: String,
      unique: true,
    },
  },
  { timestamps: true },
);

const User: Model<UserTypes> = mongoose.model<UserTypes>("User", UserSchema);
export default User;
