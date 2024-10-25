import { CustomerProfile } from "@/app/models/customer-profile-model";
import { ProductReview } from "@/app/models/product-review-model";
import { dbConnect } from "@/utils/mongo";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await dbConnect();
    const header = headers();
    const userId = header.get("id");
    const reqObj = await req.json();
    const { description, rating, productId } = reqObj;
    const customer = await CustomerProfile.findOne(userId);
    const customerId = customer._id;

    reqObj.customerId = customer._id;
    const productReview = await ProductReview.create({
      description,
      rating,
      customerId,
      productId,
    });
    return NextResponse.json({ status: "success", data: productReview });
  } catch (error) {
    return NextResponse.json({ status: "fail", data: error.message });
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    const productReview = await ProductReview.find({
      productId: productId,
    }).populate({
      path: "customerId",
      model: CustomerProfile,
      select: "cusName -_id",
    });

    return NextResponse.json({ status: 201, productReview });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
