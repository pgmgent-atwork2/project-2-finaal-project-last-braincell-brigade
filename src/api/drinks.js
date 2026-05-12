import { supabase } from "../../backend/config/supabaseClient";

export async function getDrinks() {
    const { data, error } = await supabase
        .from('drinks')
        .select('*')
        .order('name');

    if (error) {
        console.error(error);
        return;
    }

    return data;
}

export async function addDrink(drink) {
    const { data, error } = await supabase
        .from('drinks')
        .insert(drink)
        .select()
        .maybeSingle();

    if (error) {
        console.error(error);
        return;
    }

    return data;
}

export async function updateDrink(id, updates) {
    const { data, error } = await supabase
        .from('drinks')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

    if (error) {
        console.error(error);
        return;
    }

    return data;
}

const BUCKET = 'drinks';

export async function uploadDrinkImage(file, drinkId) {
    const ext = file.name.split('.').pop();
    const filename = drinkId
        ? `${drinkId}.${ext}`
        : `${Date.now()}.${ext}`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filename, file, { upsert: true });

    if (error) {
        console.error('Upload error:', error);
        return null;
    }

    const { data } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filename);

    return data.publicUrl;
}