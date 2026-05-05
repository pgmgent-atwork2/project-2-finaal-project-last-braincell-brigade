import { supabase } from '../../backend/config/supabaseClient.js';

export async function getCategories() {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
    if (error) {
        console.error(error);
        return;
    }
    return data;
}