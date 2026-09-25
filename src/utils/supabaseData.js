import { supabase } from '../lib/supabase';

const camelToSnake = key => key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const snakeToCamel = key => key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

export const mapRow = row => Object.fromEntries(Object.entries(row).map(([key, value]) => {
  const frontendKey = snakeToCamel(key);
  const frontendValue = (frontendKey === 'startTime' || frontendKey === 'endTime') && typeof value === 'string'
    ? value.slice(0, 5)
    : value;
  return [frontendKey, frontendValue];
}));

export const mapPayload = data => Object.fromEntries(
  Object.entries(data)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => [camelToSnake(key), value]),
);

export function normalizeSupabaseError(error) {
  if (!error) return new Error('Supabase request failed.');
  if (error.code === '23505') return new Error('That value already exists.');
  if (error.code === '23P01') return new Error('This work entry overlaps another entry for the employee.');
  if (error.code === '42501') return new Error('You are not authorized to perform this action.');
  return new Error(error.message || 'Supabase request failed.');
}

export async function selectRows(table) {
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: true });
  if (error) throw normalizeSupabaseError(error);
  return data.map(mapRow);
}

export async function insertRow(table, payload) {
  const { data, error } = await supabase.from(table).insert(mapPayload(payload)).select().single();
  if (error) throw normalizeSupabaseError(error);
  return mapRow(data);
}

export async function updateRow(table, id, payload) {
  const { data, error } = await supabase.from(table).update(mapPayload(payload)).eq('id', id).select().single();
  if (error) throw normalizeSupabaseError(error);
  return mapRow(data);
}

export async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw normalizeSupabaseError(error);
  return null;
}
