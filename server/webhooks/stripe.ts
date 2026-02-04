import type { Request, Response } from "express";
import { stripe } from "../stripe";
import * as db from "../db";

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("[Stripe Webhook] Missing signature");
    return res.status(400).send("Missing signature");
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured");
    return res.status(500).send("Webhook secret not configured");
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const registrationId = parseInt(session.client_reference_id || session.metadata?.registration_id);

        if (!registrationId) {
          console.error("[Stripe Webhook] No registration ID found in session");
          break;
        }

        // Update registration payment status
        await db.updateRegistration(registrationId, {
          paymentStatus: "paid",
        });

        // Create or update payment record
        const existingPayment = await db.getPaymentByRegistrationId(registrationId);
        
        if (existingPayment) {
          await db.updatePayment(existingPayment.id, {
            status: "completed",
            transactionId: session.payment_intent,
            paidAt: new Date(),
            paymentData: JSON.stringify({
              sessionId: session.id,
              paymentIntent: session.payment_intent,
            }),
          });
        } else {
          await db.createPayment({
            registrationId,
            paymentMethod: "stripe",
            amount: (session.amount_total / 100).toString(),
            currency: session.currency.toUpperCase(),
            status: "completed",
            transactionId: session.payment_intent,
            paidAt: new Date(),
            paymentData: JSON.stringify({
              sessionId: session.id,
              paymentIntent: session.payment_intent,
            }),
          });
        }

        console.log(`[Stripe Webhook] Payment completed for registration ${registrationId}`);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as any;
        console.log(`[Stripe Webhook] PaymentIntent succeeded: ${paymentIntent.id}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as any;
        console.error(`[Stripe Webhook] PaymentIntent failed: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing event:", error);
    res.status(500).send("Error processing webhook");
  }
}
