import { Invoice } from "@/app/models/invoice-model";
import { dbConnect } from "@/utils/mongo";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const tranId = searchParams.get("tran_id");

    const invoice = await Invoice.updateMany(
      { tranId },
      { paymentStatus: "Failed" }
    );
    return NextResponse.json({ status: "fail", data: invoice });
  } catch (error) {
    return NextResponse.json(
      { status: "fail", data: error.message },
      { status: 500 }
    );
  }
}
