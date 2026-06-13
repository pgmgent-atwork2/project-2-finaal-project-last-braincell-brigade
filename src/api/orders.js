import { supabase } from "../../backend/config/supabaseClient.js";

export async function getOrCreateOrder() {
  const { data: { user } } = await supabase.auth.getUser();
  const isGuest = !user;

  if (!isGuest) {
    const { data: existing } = await supabase
      .from('orders')
      .select('*')
      .eq('profile_id', user.id)
      .eq('status', 'open')
      .maybeSingle();

    if (existing) return existing;
  } else {
    const guestOrderId = localStorage.getItem('guest_order_id');
    if (guestOrderId) {
      const { data: existing } = await supabase
        .from('orders')
        .select('*')
        .eq('id', guestOrderId)
        .eq('status', 'open')
        .maybeSingle();

      if (existing) return existing;
    }
  }

  const { data: created } = await supabase
    .from('orders')
    .insert({
      profile_id: isGuest ? null : user.id,
      status: 'open',
      guest: isGuest,
    })
    .select()
    .maybeSingle();

  if (isGuest && created) {
    localStorage.setItem('guest_order_id', created.id);
  }

  return created;
}

export async function getClosedOrders() {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, drinks(name, price, image_url)), profiles(first_name, last_name)')
    .eq('profile_id', user.id)
    .eq('status', 'closed')
    .order('updated_at', { ascending: false });

  if (error) console.error('getClosedOrders error:', error);
  return data || [];
}

export async function getAccountOrders() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, drinks(name, price, image_url)), profiles(first_name, last_name)')
    .eq('profile_id', user.id)
    .eq('status', 'account')
    .order('updated_at', { ascending: false });

  if (error) console.error('getAccountOrders error:', error);
  return data || [];
}

export async function getOpenOrders() {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, drinks(name, price, image_url)), profiles(first_name, last_name)')
    .eq('profile_id', user.id)
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (error) console.error('getOpenOrders error:', error);
  return data || [];
}

export async function addDrinkToOrder(orderId, drink, quantity = 1) {
  const { data: existing, error: selectError } = await supabase
    .from('order_items')
    .select('id, quantity')
    .eq('order_id', orderId)
    .eq('drink_id', drink.id)
    .maybeSingle();

  if (selectError) {
    console.error('select error:', selectError);
    return;
  }

  if (existing) {
    const { error } = await supabase
      .from('order_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id);

    if (error) console.error('update quantity error:', error);
  } else {
    const { error: insertError } = await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        drink_id: drink.id,
        quantity,
        price_at_order: drink.price,
      });
    if (insertError) console.error('insert error:', insertError);
  }
}

export async function getOrderItems(orderId) {
  const { data } = await supabase
    .from('order_items')
    .select('*, drinks(name, price, image_url)')
    .eq('order_id', orderId);

  return data || [];
}

export async function removeOrderItem(itemId) {
  await supabase
    .from('order_items')
    .delete()
    .eq('id', itemId);
}

export async function closeOrder(orderId) {
  await supabase
    .from('orders')
    .update({ status: 'closed', updated_at: new Date().toISOString() })
    .eq('id', orderId);

  localStorage.removeItem('guest_order_id');
}

export async function putOrderOnAccount(orderId) {
  await supabase
    .from('orders')
    .update({ status: 'account', updated_at: new Date().toISOString() })
    .eq('id', orderId);
}

export async function startGuestPayment(orderId, amount, description, orderIds = null) {
  const response = await fetch('/api/pay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, orderIds, amount, description }),
  });

  if (!response.ok) {
    throw new Error('Failed to start payment');
  }

  const { checkoutUrl } = await response.json();
  window.location.href = checkoutUrl;
}
