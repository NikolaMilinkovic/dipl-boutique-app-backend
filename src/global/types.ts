export interface CategoryTypes {
  _id: string;
  name: string;
  stockType: StockTypeTypes;
}
export interface ColorSizeTypes {
  _id: string;
  size: string;
  stock: number;
}
export interface CourierTypes {
  _id: string;
  name: string;
}
export interface DressColorTypes {
  _id?: string;
  color: string;
  colorCode: string;
  sizes: ColorSizeTypes[];
}
export interface DressTypes {
  _id: string;
  active: boolean;
  category: string;
  colors: DressColorTypes[];
  description: string;
  image: ImageTypes;
  name: string;
  price: number;
  stockType: StockTypeTypes;
  supplier?: string;
  totalStock: number;
}
export interface ImageTypes {
  imageName: string;
  uri: string;
}
export type NewColorObjectTypes = NewDressColorTypes[] | NewPurseColorTypes[];

export interface NewDressColorTypes {
  _id?: string;
  color: string;
  colorCode: string;
  sizes: ColorSizeTypes[];
}

export interface NewProductTypes {
  active: boolean;
  category: string;
  colors: NewColorObjectTypes;
  description: string;
  image: File | null;
  name: string;
  price: number;
  stockType: StockTypeTypes;
  supplier?: string;
  totalStock: number;
}

export interface NewPurseColorTypes {
  _id?: string;
  color: string;
  colorCode: string;
  stock: number;
}
export type ProductColorTypes = DressColorTypes | PurseColorTypes;
// PURSE & DRESS TYPE
export type ProductTypes = DressTypes | PurseTypes;

export interface ProfileImageTypes {
  imageName: string;
  uri: string;
}

export interface PurseColorTypes {
  _id?: string;
  color: string;
  colorCode: string;
  stock: number;
}
export interface PurseTypes {
  _id: string;
  active: boolean;
  category: string;
  colors: PurseColorTypes[];
  description: string;
  image: ImageTypes;
  name: string;
  price: number;
  stockType: StockTypeTypes;
  supplier?: string;
  totalStock: number;
}

export type StockTypeTypes = "Boja-Količina" | "Boja-Veličina-Količina";
