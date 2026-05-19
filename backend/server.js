import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createMollieClient } from '@mollie/api-client';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.VITE_FRONTEND_URL,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mollie = createMollieClient({
  apiKey: process.env.MOLLIE_API_KEY,
});

const supabase = createClient(
  process.env.VITE_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.post('/api/pay', async (req, res) => {
  const { orderId, amount, description } = req.body;

  try {
    const payment = await mollie.payments.create({
      amount: {
        currency: 'EUR',
        value: amount,
      },
      description,
      redirectUrl: `${process.env.VITE_FRONTEND_URL}/payment-return.html?orderId=${orderId}`,
      webhookUrl: `${process.env.BACKEND_URL}/api/webhook`,
      metadata: { orderId: String(orderId) },
    });

    res.json({ checkoutUrl: payment.getCheckoutUrl() });
  } catch (err) {
    console.error('Mollie payment creation error:', err);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

app.post('/api/webhook', async (req, res) => {
  try {
    console.log('Webhook body:', req.body);
    const paymentId = req.body.id;

    if (!paymentId) {
      console.error('No payment id received');
      return res.sendStatus(400);
    }

    const payment = await mollie.payments.get(paymentId);
    const orderId = payment.metadata.orderId;

    console.log('Payment status:', payment.status);

    let newStatus;
    if (payment.status === 'paid') {
      newStatus = 'closed';
    } else if (['failed', 'canceled', 'expired'].includes(payment.status)) {
      newStatus = 'payment_failed';
    }

    if (newStatus) {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) {
        console.error('Supabase update error:', error);
      } else {
        console.log(`Order ${orderId} set to ${newStatus}`);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(500);
  }
});

app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});