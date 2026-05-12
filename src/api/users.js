import { supabase } from '../../backend/config/supabaseClient.js';

export async function getUsers() {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name');

    if (error) {
        console.error('getUsers error:', error);
        return [];
    }

    return data;
}