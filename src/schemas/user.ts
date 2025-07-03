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
      default: () => ({
        category: {
          add_category: true,
          edit_category: true,
          remove_category: true,
        },
        color: {
          add_color: true,
          edit_color: true,
          remove_color: true,
        },
        courier: {
          add_courier: true,
          edit_courier: true,
          remove_courier: true,
        },
        supplier: {
          add_supplier: true,
          edit_supplier: true,
          remove_supplier: true,
        },
      }),
      type: Object,
    },
    role: {
      default: "admin",
      required: true,
      type: String,
    },
    settings: {
      default: () => ({
        defaults: {
          courier: "",
          listProductsBy: "category",
        },
      }),
      type: Object,
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
