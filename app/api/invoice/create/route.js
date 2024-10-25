import { CustomerProfile } from "@/app/models/customer-profile-model";
import { Invoice } from "@/app/models/invoice-model";
import { InvoiceProduct } from "@/app/models/invoice-product-model";
import { ProductCart } from "@/app/models/product-cart-model";
import { Product } from "@/app/models/product-model";
import { SslcommerzAccount } from "@/app/models/sslcommerze-account-model";
import { dbConnect } from "@/utils/mongo";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await dbConnect();
    const header = headers();
    const userId = header.get("id");
    const userEmail = header.get("email");

    const cartProducts = await ProductCart.find({ userId }).populate({
      path: "productId",
      model: Product,
    });

    const totalAmount = cartProducts.reduce((acc, curr) => {
      const product = curr.productId;

      if (
        product.discount &&
        product.discount > 0 &&
        product.discountPrice > 0
      ) {
        return acc + product.discountPrice * curr.qty;
      } else {
        return acc + product.price * curr.qty;
      }
    }, 0);

    const vat = totalAmount * 0.15;
    const total = totalAmount + vat;
    const payable = total;
    const profile = await CustomerProfile.findOne({ userId });
    const cusDetails = `${profile.cusName} ${profile.cusPostcode}\n${profile.cusCity}\n${profile.cusFax}, ${profile.cusState} ${profile.cusCountry}\n${profile.cusPhone}`;
    const shipDetails = `${profile.cusName} ${profile.cusPostcode}\n${profile.cusCity}\n${profile.cusFax}, ${profile.cusState} ${profile.cusCountry}\n${profile.cusPhone}`;

    const tranId = Math.random()
      .toString(36)
      .substring(2, 15)
      .toLocaleUpperCase();
    const valId = "0";
    const deliveryStatus = "Pending";
    const paymentStatus = "Pending";

    const createInvoice = await Invoice.create({
      total,
      vat,
      payable,
      cusDetails,
      shipDetails,
      tranId,
      valId,
      deliveryStatus,
      paymentStatus,
      userId,
    });

    const invoiceId = createInvoice._id;

    for (const element of cartProducts) {
      await InvoiceProduct.create({
        invoiceId,
        productId: element.productId,
        userId,
        qty: element.qty,
        salePrice: element.productId.discount
          ? element.productId.discountPrice
          : element.productId.price,
        color: element.color,
        size: element.size,
      });
    }

    await ProductCart.deleteMany({ userId });

    const sslcommerzAccount = await SslcommerzAccount.findOne({});

    const form = new FormData();
    form.append("store_id", sslcommerzAccount.storeId);
    form.append("store_passwd", sslcommerzAccount.storePasswd);
    form.append("total_amount", payable);
    form.append("currency", sslcommerzAccount.currency);
    form.append("tran_id", tranId);

    form.append(
      "success_url",
      `${sslcommerzAccount.successUrl}?tran_id=${tranId}`
    );
    form.append("fail_url", `${sslcommerzAccount.failUrl}?tran_id=${tranId}`);
    form.append(
      "cancel_url",
      `${sslcommerzAccount.cancelUrl}?tran_id=${tranId}`
    );
    form.append("ipn_url", `${sslcommerzAccount.ipnUrl}?tran_id=${tranId}`);

    form.append("cus_name", profile.cusName);
    form.append("cus_email", userEmail);
    form.append("cus_add1", profile.cusAddress1);
    form.append("cus_add2", profile.cusAddress2);
    form.append("cus_city", profile.cusCity);
    form.append("cus_state", profile.cusState);
    form.append("cus_postcode", profile.cusPostcode);
    form.append("cus_country", profile.cusCountry);
    form.append("cus_phone", profile.cusPhone);
    form.append("cus_fax", profile.cusFax);

    form.append("shipping_method", "YES");
    form.append("ship_name", profile.shipName);
    form.append("ship_add1", profile.shipAddress1);
    form.append("ship_add2", profile.shipAddress2);
    form.append("ship_city", profile.shipCity);
    form.append("ship_state", profile.shipState);
    form.append("ship_country", profile.shipCountry);
    form.append("ship_postcode", profile.shipPostcode);

    form.append("product_name", "According Invoice");
    form.append("product_category", "According Invoice");
    form.append("product_profile", "According Invoice");
    form.append("product_amount", "According Invoice");

    const sslres = await fetch(sslcommerzAccount.initUrl, {
      method: "POST",
      body: form,
    });

    const sslResponse = await sslres.json();

    return NextResponse.json({ sslResponse }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
