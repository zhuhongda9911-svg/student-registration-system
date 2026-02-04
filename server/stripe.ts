import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-01-28.clover",
});

// Create a checkout session for registration payment
export async function createCheckoutSession(params: {
  registrationId: number;
  amount: number;
  activityTitle: string;
  studentName: string;
  guardianEmail?: string;
  origin: string;
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "cny",
          product_data: {
            name: params.activityTitle,
            description: `学生：${params.studentName}`,
          },
          unit_amount: Math.round(parseFloat(params.amount.toString()) * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${params.origin}/receipt/${params.registrationId}`,
    cancel_url: `${params.origin}/payment/${params.registrationId}`,
    client_reference_id: params.registrationId.toString(),
    customer_email: params.guardianEmail,
    metadata: {
      registration_id: params.registrationId.toString(),
      student_name: params.studentName,
    },
    allow_promotion_codes: true,
  });

  return session;
}
