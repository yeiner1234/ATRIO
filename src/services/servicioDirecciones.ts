import { supabase } from '@/lib/supabase';
import type { DatosDireccion, Direccion } from '@/types';

function requerirSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado en este entorno (faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY).',
    );
  }
  return supabase;
}

async function requerirUsuarioId(): Promise<string> {
  const { data, error } = await requerirSupabase().auth.getSession();
  if (error || !data.session) throw new Error('Debes iniciar sesión para gestionar tus direcciones.');
  return data.session.user.id;
}

interface FilaDireccion {
  id: string;
  etiqueta: string | null;
  direccion: string;
  distrito: string | null;
  referencia: string | null;
  predeterminada: boolean;
}

function mapearDireccion(fila: FilaDireccion, usuarioId: string): Direccion {
  return {
    id: fila.id,
    usuarioId,
    etiqueta: fila.etiqueta ?? undefined,
    direccion: fila.direccion,
    distrito: fila.distrito ?? '',
    referencia: fila.referencia ?? undefined,
    predeterminada: fila.predeterminada,
  };
}

// Solo el propio usuario ve/crea/edita sus direcciones — lo garantiza RLS
// (usuario_id = auth.uid()) del lado de Supabase, esto solo filtra por
// prolijidad además de por seguridad real.
export const servicioDirecciones = {
  async obtenerDirecciones(): Promise<Direccion[]> {
    const usuarioId = await requerirUsuarioId();
    const { data, error } = await requerirSupabase()
      .from('direcciones')
      .select('id, etiqueta, direccion, distrito, referencia, predeterminada')
      .eq('usuario_id', usuarioId)
      .order('creado_en', { ascending: true });

    if (error) throw new Error(`No se pudieron cargar las direcciones: ${error.message}`);
    return (data ?? []).map((fila) => mapearDireccion(fila as FilaDireccion, usuarioId));
  },

  async crearDireccion(datos: DatosDireccion): Promise<Direccion> {
    const cliente = requerirSupabase();
    const usuarioId = await requerirUsuarioId();

    // Si va a ser la predeterminada (o es la primera), primero se le quita el
    // flag a las demás — no hay trigger en la base que lo garantice.
    if (datos.predeterminada) {
      await cliente.from('direcciones').update({ predeterminada: false }).eq('usuario_id', usuarioId);
    } else {
      const { count } = await cliente
        .from('direcciones')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', usuarioId);
      if (!count) datos = { ...datos, predeterminada: true };
    }

    const { data, error } = await cliente
      .from('direcciones')
      .insert({
        usuario_id: usuarioId,
        etiqueta: datos.etiqueta ?? null,
        direccion: datos.direccion,
        distrito: datos.distrito || null,
        referencia: datos.referencia ?? null,
        predeterminada: datos.predeterminada,
      })
      .select('id, etiqueta, direccion, distrito, referencia, predeterminada')
      .single();

    if (error) throw new Error(`No se pudo crear la dirección: ${error.message}`);
    return mapearDireccion(data as FilaDireccion, usuarioId);
  },

  async actualizarDireccion(id: string, datos: DatosDireccion): Promise<Direccion> {
    const cliente = requerirSupabase();
    const usuarioId = await requerirUsuarioId();

    if (datos.predeterminada) {
      await cliente.from('direcciones').update({ predeterminada: false }).eq('usuario_id', usuarioId);
    }

    const { data, error } = await cliente
      .from('direcciones')
      .update({
        etiqueta: datos.etiqueta ?? null,
        direccion: datos.direccion,
        distrito: datos.distrito || null,
        referencia: datos.referencia ?? null,
        predeterminada: datos.predeterminada,
      })
      .eq('id', id)
      .eq('usuario_id', usuarioId)
      .select('id, etiqueta, direccion, distrito, referencia, predeterminada')
      .single();

    if (error) throw new Error(`No se pudo actualizar la dirección: ${error.message}`);
    return mapearDireccion(data as FilaDireccion, usuarioId);
  },

  async eliminarDireccion(id: string): Promise<void> {
    const usuarioId = await requerirUsuarioId();
    const { error } = await requerirSupabase()
      .from('direcciones')
      .delete()
      .eq('id', id)
      .eq('usuario_id', usuarioId);
    if (error) throw new Error(`No se pudo eliminar la dirección: ${error.message}`);
  },
};
