import { supabase } from '@/lib/supabase';
import { servicioProductos } from './servicioProductos';
import type { ItemCarrito } from '@/types';

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
  if (error || !data.session) throw new Error('Debes iniciar sesión para usar el carrito.');
  return data.session.user.id;
}

// Un solo carrito por usuario (carritos.usuario_id es UNIQUE) — se crea la
// primera vez que hace falta, nunca antes.
async function obtenerOCrearCarritoId(usuarioId: string): Promise<string> {
  const cliente = requerirSupabase();
  const { data: existente, error: errorLectura } = await cliente
    .from('carritos')
    .select('id')
    .eq('usuario_id', usuarioId)
    .maybeSingle();
  if (errorLectura) throw new Error(`No se pudo abrir el carrito: ${errorLectura.message}`);
  if (existente) return (existente as { id: string }).id;

  const { data: creado, error: errorCreacion } = await cliente
    .from('carritos')
    .insert({ usuario_id: usuarioId })
    .select('id')
    .single();
  if (errorCreacion) throw new Error(`No se pudo crear el carrito: ${errorCreacion.message}`);
  return (creado as { id: string }).id;
}

interface FilaItemCarrito {
  variante_id: string;
  cantidad: number;
  variantes_producto: { producto_id: string; talla: string; color_id: string } | null;
}

export const servicioCarrito = {
  async obtenerItems(): Promise<ItemCarrito[]> {
    const usuarioId = await requerirUsuarioId();
    const carritoId = await obtenerOCrearCarritoId(usuarioId);

    const { data, error } = await requerirSupabase()
      .from('items_carrito')
      .select('variante_id, cantidad, variantes_producto ( producto_id, talla, color_id )')
      .eq('carrito_id', carritoId);
    if (error) throw new Error(`No se pudo cargar el carrito: ${error.message}`);

    const filas = (data ?? []) as unknown as FilaItemCarrito[];
    const idsProducto = [...new Set(filas.map((f) => f.variantes_producto?.producto_id).filter((id): id is string => !!id))];
    const productos = await Promise.all(idsProducto.map((id) => servicioProductos.obtenerProductoPorId(id)));
    const mapaProductos = new Map(productos.filter((p) => p !== undefined).map((p) => [p!.id, p!]));

    const items: ItemCarrito[] = [];
    for (const fila of filas) {
      if (!fila.variantes_producto) continue;
      const producto = mapaProductos.get(fila.variantes_producto.producto_id);
      if (!producto) continue; // producto desactivado/borrado entre tanto: se ignora, no se rompe el carrito
      items.push({
        producto,
        varianteId: fila.variante_id,
        talla: fila.variantes_producto.talla,
        colorId: fila.variantes_producto.color_id,
        cantidad: fila.cantidad,
      });
    }
    return items;
  },

  /** Deja la línea (producto+variante) en exactamente esta cantidad. */
  async fijarCantidad(varianteId: string, cantidad: number): Promise<void> {
    const usuarioId = await requerirUsuarioId();
    const carritoId = await obtenerOCrearCarritoId(usuarioId);
    const { error } = await requerirSupabase()
      .from('items_carrito')
      .upsert({ carrito_id: carritoId, variante_id: varianteId, cantidad }, { onConflict: 'carrito_id,variante_id' });
    if (error) throw new Error(`No se pudo actualizar el carrito: ${error.message}`);
  },

  async quitarItem(varianteId: string): Promise<void> {
    const usuarioId = await requerirUsuarioId();
    const carritoId = await obtenerOCrearCarritoId(usuarioId);
    const { error } = await requerirSupabase()
      .from('items_carrito')
      .delete()
      .eq('carrito_id', carritoId)
      .eq('variante_id', varianteId);
    if (error) throw new Error(`No se pudo quitar el producto del carrito: ${error.message}`);
  },

  async vaciar(): Promise<void> {
    const usuarioId = await requerirUsuarioId();
    const carritoId = await obtenerOCrearCarritoId(usuarioId);
    const { error } = await requerirSupabase().from('items_carrito').delete().eq('carrito_id', carritoId);
    if (error) throw new Error(`No se pudo vaciar el carrito: ${error.message}`);
  },
};
