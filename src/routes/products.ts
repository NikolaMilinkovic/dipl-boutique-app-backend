/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import multer from "multer";

// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { addProduct, deleteProduct, getProducts, updateProduct } from "../controllers/products/productControler.js";
import { checkPermission } from "../utils/helperMethods.js";

// import {
//   addDress,
//   addPurse,
//   deleteDress,
//   deletePurse,
//   getAllActiveDresses,
//   getAllActivePurses,
//   getAllInactiveDresses,
//   getAllInactivePurses,
//   removeProductBatch,
//   updateProduct,
// } from "./yourControllerFile";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.route("/add").post(checkPermission("product", "add") as any, upload.single("image"), addProduct);
router.route("/get-all-products").get(getProducts);
router.route("/delete").delete(checkPermission("product", "remove") as any, deleteProduct);
router.route("/update").patch(checkPermission("product", "edit") as any, upload.single("image"), updateProduct);

// router.route("/delete-item-batch").delete(removeProductBatch);

// router.route("/update/:id").put(upload.single("image"), updateProduct);

// // =======================[ DRESSES ]=======================
// router.route("/dress/:id").delete(deleteDress);
// router.route("/dress").post(upload.single("image"), addDress);
// router.route("/active-dresses").get(getAllActiveDresses);
// router.route("/inactive-dresses").get(getAllInactiveDresses);
// // =======================[ \DRESSES ]=======================

// // =======================[ PURSES ]=======================
// router.route("/purse/:id").delete(deletePurse);
// router.route("/purse").post(upload.single("image"), addPurse);
// router.route("/active-purses").get(getAllActivePurses);
// router.route("/inactive-purses").get(getAllInactivePurses);
// // =======================[ \PURSES ]=======================

export default router;
