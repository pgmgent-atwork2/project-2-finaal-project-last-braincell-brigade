import { supabase } from "../../backend/config/supabaseClient.js";

export async function getOrCreateOrder() {
  const { data: { user } } = await supabase.auth.getUser();

  const { data: existing } = await supabase
    .from('orders')
    .select('*')
    .eq('profile_id', user.id)
    .eq('status', 'open')
    .maybeSingle();

  if (existing) return existing;

  const { data: created } = await supabase
    .from('orders')
    .insert({ profile_id: user.id, status: 'open' })
    .select()
    .maybeSingle();

  return created;
}

export async function addDrinkToOrder(orderId, drink) {
  const { data: existing } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .eq('drink_id', drink.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('order_items')
      .update({ quantity: existing.quantity + 1 })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        drink_id: drink.id,
        quantity: 1,
        price_at_order: drink.price
      });
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
}