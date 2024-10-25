import { Invoice } from "@/app/models/invoice-model";
import { dbConnect } from "@/utils/mongo";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await dbConnect();
    const header = headers();
    const userId = header.get("id");
    const invoice = await Invoice.find({ userId });
    return NextResponse.json({ status: "success", data: invoice });
  } catch (error) {
    return NextResponse.json({ status: "fail", data: error.message });
  }
}
