import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_KEY
);

const params = new URLSearchParams(window.location.search);
const orderId = params.get('orderId');
const el = document.getElementById('status-message');

if (!orderId) {
  el.innerHTML = `
    <div class="payment-icon">⚠️</div>
    <h1 class="payment-title">Something went wrong</h1>
    <p class="payment-text">No order could be found.</p>
    <div class="payment-actions">
      <a class="payment-btn payment-btn-primary" href="/src/views/drinks.html">Back to menu</a>
    </div>
  `;
} else {
  let attempts = 0;
  const maxAttempts = 10;

  async function checkStatus() {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('status')        
        .eq('id', orderId)
        .maybeSingle();

      if (error) {
        console.error(error);
        el.innerHTML = `
          <div class="payment-icon">⚠️</div>
          <h1 class="payment-title">Error checking payment</h1>
          <p class="payment-text">We could not verify your payment.</p>
          <div class="payment-actions">
            <a class="payment-btn payment-btn-primary" href="/src/views/drinks.html">Back to menu</a>
          </div>
        `;
        return;
      }

      if (order?.status === 'closed') {
        localStorage.removeItem('guest_order_id');
        el.innerHTML = `
          <div class="payment-icon">✅</div>
          <h1 class="payment-title">Payment successful!</h1>
          <p class="payment-text">Thanks for your order at Ping Pong Hub. Your drinks are now being prepared.</p>
          <div class="payment-actions">
            <a class="payment-btn payment-btn-primary" href="/src/views/drinks.html">Order more drinks</a>
          </div>
        `;
        return;
      }

      if (order?.status === 'payment_failed') {
        el.innerHTML = `
          <div class="payment-icon">❌</div>
          <h1 class="payment-title">Payment unsuccessful</h1>
          <p class="payment-text">Your payment was canceled, failed, or expired.</p>
          <div class="payment-actions">
            <a class="payment-btn payment-btn-primary" href="/src/views/drinks.html">Try again</a>
          </div>
        `;
        return;
      }

      if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkStatus, 2000);
      } else {
        el.innerHTML = `
          <div class="payment-loader"></div>
          <h1 class="payment-title">Payment pending</h1>
          <p class="payment-text">Your payment is still processing. This can take a few seconds.</p>
          <div class="payment-actions">
            <a class="payment-btn payment-btn-secondary" href="/src/views/drinks.html">Back to menu</a>
          </div>
        `;
      }
    } catch (err) {
      console.error(err);
      el.innerHTML = `
        <div class="payment-icon">⚠️</div>
        <h1 class="payment-title">Unexpected error</h1>
        <p class="payment-text">Something went wrong while checking your payment.</p>
        <div class="payment-actions">
          <a class="payment-btn payment-btn-primary" href="/src/views/drinks.html">Back to menu</a>
        </div>
      `;
    }
  }

  checkStatus();
}