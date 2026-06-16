import { supabase } from "../../backend/config/supabaseClient.js";

export async function getMatches() {
    const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('Starts', { ascending: true });

    if (error) {
        console.error('getMatches error:', error);
        throw error;
    }

    return data;
}

export async function createMatch(match) {
    const { data, error } = await supabase
        .from('matches')
        .insert([match])
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function updateMatch(id, updates) {
    const { data, error } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

    if (error) {
        console.error('updateMatch error:', error);
        return null;
    }

    return data;
}

export async function deleteMatch(id) {
    const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('deleteMatch error:', error);
        return false;
    }

    return true;
}
