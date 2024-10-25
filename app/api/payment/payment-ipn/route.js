import { Invoice } from "@/app/models/invoice-model";
import { dbConnect } from "@/utils/mongo";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const tranId = searchParams.get("tran_id");
    const reqObj = await req.json();
    const { status } = reqObj;

    const invoice = await Invoice.updateMany(
      { tranId },
      { paymentStatus: status }
    );
    return NextResponse.json({ status: "success", data: invoice });
  } catch (error) {
    return NextResponse.json(
      { status: "fail", data: error.message },
      { status: 500 }
    );
  }
}
