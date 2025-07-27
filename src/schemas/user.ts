import { ObjectId } from "mongodb";
import mongoose, { Document, Model, Schema } from "mongoose";

export interface UserTypes extends Document {
  _id: ObjectId;
  password: string;
  permissions: PermissionTypes;
  role: string;
  settings?: {
    defaults: {
      courier?: string;
      listProductsBy?: string;
    };
  };
  username: string;
}

interface CRUD_PermissionTypes {
  add: string;
  edit: string;
  remove: string;
}

interface PermissionTypes {
  category: CRUD_PermissionTypes;
  color: CRUD_PermissionTypes;
  courier: CRUD_PermissionTypes;
  order: CRUD_PermissionTypes;
  product: CRUD_PermissionTypes;
  supplier: CRUD_PermissionTypes;
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
          add: true,
          edit: true,
          remove: true,
        },
        color: {
          add: true,
          edit: true,
          remove: true,
        },
        courier: {
          add: true,
          edit: true,
          remove: true,
        },
        order: {
          add: true,
          edit: true,
          remove: true,
        },
        product: {
          add: true,
          edit: true,
          remove: true,
        },
        supplier: {
          add: true,
          edit: true,
          remove: true,
        },
      }),
      type: Object,
    },
    role: {
      default: "user",
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
