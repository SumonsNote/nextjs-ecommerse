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
      { paymentStatus: "Cancel" }
    );
    return NextResponse.json({ status: "cancel", data: invoice });
  } catch (error) {
    return NextResponse.json(
      { status: "fail", data: error.message },
      { status: 500 }
    );
  }
}
