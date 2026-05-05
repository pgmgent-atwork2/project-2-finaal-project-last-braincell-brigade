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