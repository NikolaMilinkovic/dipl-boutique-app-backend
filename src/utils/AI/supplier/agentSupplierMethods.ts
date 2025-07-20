/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { addSupplierLogic, deleteSupplierLogic, getSuppliersLogic, updateSupplierLogic } from "../../../controllers/suppliers/supplierMethods.js";

export async function agentSupplierMethods(name: string, args: any) {
  let functionResult;
  if (name === "add_supplier") {
    functionResult = await addSupplierLogic(args.name as string);
  }
  if (name === "get_suppliers") {
    functionResult = await getSuppliersLogic();
  }
  if (name === "delete_supplier") {
    functionResult = await deleteSupplierLogic(args.id as string);
  }
  if (name === "update_supplier") {
    functionResult = await updateSupplierLogic(args.id as string, args.name as string);
  }

  return functionResult;
}
