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