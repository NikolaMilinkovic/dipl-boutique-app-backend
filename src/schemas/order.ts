import { Document, model, Schema, Types } from "mongoose";

export interface OrderDocument extends Document {
  buyer: Buyer;
  courier?: {
    deliveryPrice?: number;
    name?: string;
  };
  deliveryRemark?: string;
  internalRemark?: string;
  orderNotes?: string;
  packed: boolean;
  packedIndicator: boolean;
  processed: boolean;
  products: Product[];
  productsPrice: number;
  reservation: boolean;
  reservationDate?: Date;
  totalPrice: number;
  value?: number;
  weight: string;
}

interface Buyer {
  address: string;
  bankNumber?: string;
  name: string;
  phone: string;
  phone2?: string;
  place: string;
  profileImage: ProfileImage;
}

interface Product {
  category: string;
  image: ProfileImage;
  itemReference: Types.ObjectId;
  mongoDB_type: "Dress" | "Purse";
  name: string;
  price: number;
  selectedColor: string;
  selectedColorId: string;
  selectedSize?: string;
  selectedSizeId?: string;
  stockType: string;
}

interface ProfileImage {
  imageName: string;
  uri: string;
}

const OrderSchema = new Schema<OrderDocument>(
  {
    buyer: {
      address: { required: true, type: String },
      bankNumber: { required: false, type: String },
      name: { required: true, type: String },
      phone: { required: true, type: String },
      phone2: { required: false, type: String },
      place: { required: true, type: String },
      profileImage: {
        imageName: { required: true, type: String },
        uri: { required: true, type: String },
      },
    },
    courier: {
      deliveryPrice: { required: false, type: Number },
      name: { required: false, type: String },
    },
    deliveryRemark: { required: false, type: String },
    internalRemark: { required: false, type: String },
    orderNotes: { required: false, type: String },
    packed: { default: false, type: Boolean },
    packedIndicator: { default: false, type: Boolean },
    processed: { default: false, type: Boolean },
    products: [
      {
        category: { required: true, type: String },
        image: {
          imageName: { required: true, type: String },
          uri: { required: true, type: String },
        },
        itemReference: { required: true, type: Schema.Types.ObjectId },
        mongoDB_type: {
          enum: ["Dress", "Purse"],
          required: true,
          type: String,
        },
        name: { required: true, type: String },
        price: { required: true, type: Number },
        selectedColor: { required: true, type: String },
        selectedColorId: { required: true, type: String },
        selectedSize: { required: false, type: String },
        selectedSizeId: { required: false, type: String },
        stockType: { required: true, type: String },
      },
    ],
    productsPrice: { required: true, type: Number },
    reservation: { default: false, type: Boolean },
    reservationDate: { required: false, type: Date },
    totalPrice: { required: true, type: Number },
    value: { required: false, type: Number },
    weight: { required: true, type: String },
  },
  { timestamps: true },
);

// Indexes
OrderSchema.index({ reservation: 1 });
OrderSchema.index({ processed: 1 });
OrderSchema.index({ packed: 1 });
OrderSchema.index({ "courier.name": 1, processed: 1, reservation: 1 });

export default model<OrderDocument>("Order", OrderSchema);
