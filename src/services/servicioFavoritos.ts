import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

function requerirSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado en este entorno (faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY).',
    );
  }
  return supabase;
}

const CODIGO_DUPLICADO = '23505'; // unique_violation — ya es favorito, no es un error real.

function esDuplicado(error: PostgrestError | null): boolean {
  return error?.code === CODIGO_DUPLICADO;
}

export const servicioFavoritos = {
  /** Solo los `producto_id` del usuario autenticado — nunca de otro usuario (RLS filtra por auth.uid()). */
  async obtenerIdsFavoritos(usuarioId: string): Promise<string[]> {
    const { data, error } = await requerirSupabase()
      .from('favoritos')
      .select('producto_id')
      .eq('usuario_id', usuarioId);

    if (error) throw new Error(`No se pudieron cargar los favoritos: ${error.message}`);
    return (data ?? []).map((fila) => (fila as { producto_id: string }).producto_id);
  },

  async agregarFavorito(usuarioId: string, productoId: string): Promise<void> {
    const { error } = await requerirSupabase()
      .from('favoritos')
      .insert({ usuario_id: usuarioId, producto_id: productoId });

    if (error && !esDuplicado(error)) {
      throw new Error(`No se pudo agregar el favorito: ${error.message}`);
    }
  },

  async quitarFavorito(usuarioId: string, productoId: string): Promise<void> {
    const { error } = await requerirSupabase()
      .from('favoritos')
      .delete()
      .eq('usuario_id', usuarioId)
      .eq('producto_id', productoId);

    if (error) throw new Error(`No se pudo quitar el favorito: ${error.message}`);
  },
};
