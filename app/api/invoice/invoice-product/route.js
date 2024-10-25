import { InvoiceProduct } from "@/app/models/invoice-product-model";
import { dbConnect } from "@/utils/mongo";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await dbConnect();
    const header = headers();
    const userId = header.get("id");
    const reqObj = await req.json();
    const { invoiceId } = reqObj;
    const invoiceProduct = await InvoiceProduct.find({
      invoiceId,
      userId,
    }).populate("productId");
    return NextResponse.json({ status: "success", data: invoiceProduct });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ status: "fail", data: error.message });
  }
}
