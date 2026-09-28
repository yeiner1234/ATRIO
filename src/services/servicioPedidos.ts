import { supabase } from '@/lib/supabase';
import { metodosEntrega } from '@/data/metodosEntrega';
import type {
  Direccion,
  EstadoPedido,
  ItemCarrito,
  MetodoEntrega,
  MetodoPago,
  Pedido,
  Producto,
} from '@/types';

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
  if (error || !data.session) throw new Error('Debes iniciar sesión para ver pedidos.');
  return data.session.user.id;
}

interface FilaItemPedido {
  variante_id: string;
  nombre_producto: string;
  talla: string;
  color_nombre: string | null;
  cantidad: number;
  precio_unitario: number;
}

interface FilaPedido {
  id: string;
  usuario_id: string;
  numero: string;
  estado: EstadoPedido;
  tipo_entrega: 'envio' | 'retiro';
  direccion_id: string | null;
  subtotal: number;
  descuento: number;
  igv: number;
  total: number;
  creado_en: string;
  items_pedido: FilaItemPedido[] | null;
  pagos: { metodo: string } | { metodo: string }[] | null;
}

// items_pedido guarda una FOTO del momento de la compra (nombre, talla,
// color, precio) — a propósito, para que el historial no cambie si el
// producto real se edita o se borra después. Por eso NO se reconstruye
// contra el producto real: se arma un `Producto` sintético solo con lo
// necesario para mostrar la línea del pedido (sin imagen real, porque
// items_pedido no la guarda).
function productoHistoricoDesde(fila: FilaItemPedido): Producto {
  return {
    id: fila.variante_id,
    sku: '',
    nombre: fila.nombre_producto,
    categoriaId: '',
    categoriaNombre: '',
    precio: fila.precio_unitario,
    descripcion: '',
    composicion: '',
    confeccion: '',
    origen: '',
    imagenes: [],
    colores: fila.color_nombre ? [{ id: '', nombre: fila.color_nombre, hex: '#CCCCCC' }] : [],
    variantes: [],
    etiquetas: [],
    esNovedad: false,
    popularidad30d: 0,
    fechaAlta: '',
    activo: true,
  };
}

function itemsDesdeFila(fila: FilaPedido): ItemCarrito[] {
  return (fila.items_pedido ?? []).map((itemFila) => ({
    producto: productoHistoricoDesde(itemFila),
    varianteId: itemFila.variante_id,
    talla: itemFila.talla,
    colorId: '',
    cantidad: itemFila.cantidad,
  }));
}

function metodoPagoDesdeFila(fila: FilaPedido): MetodoPago {
  const pago = Array.isArray(fila.pagos) ? fila.pagos[0] : fila.pagos;
  return (pago?.metodo as MetodoPago) ?? 'contra_entrega';
}

// El costo de envío no tiene columna propia (confirmado): se reconstruye de
// forma exacta a partir de los totales ya guardados, que sí son la fuente
// oficial. Lo que NO se puede recuperar es cuál de las opciones de envío
// (estándar/express) fue exactamente — solo que fue "envío" o "retiro".
function metodoEntregaDesdeFila(fila: FilaPedido): MetodoEntrega {
  // total = (subtotal - descuento) + envío → envío = total - subtotal + descuento.
  const costoEnvio = Math.max(0, fila.total - fila.subtotal + fila.descuento);
  const base =
    metodosEntrega.find((m) => m.tipo === fila.tipo_entrega) ??
    metodosEntrega.find((m) => m.tipo === 'retiro')!;
  return fila.tipo_entrega === 'envio' ? { ...base, costo: costoEnvio } : base;
}

function mapearPedido(
  fila: FilaPedido,
  direccion: Direccion | null,
  nombreCliente: string,
): Pedido {
  const metodoEntrega = metodoEntregaDesdeFila(fila);
  const envio = metodoEntrega.tipo === 'envio' ? metodoEntrega.costo : 0;
  return {
    numero: fila.numero,
    usuarioId: fila.usuario_id,
    cliente: nombreCliente,
    fecha: fila.creado_en,
    metodoPago: metodoPagoDesdeFila(fila),
    estado: fila.estado,
    items: itemsDesdeFila(fila),
    direccion: metodoEntrega.tipo === 'envio' ? direccion : null,
    metodoEntrega,
    resumen: {
      subtotal: fila.subtotal,
      descuento: fila.descuento,
      igv: fila.igv,
      total: fila.total,
      envio,
    },
  };
}

const SELECT_PEDIDO = `
  id, usuario_id, numero, estado, tipo_entrega, direccion_id, subtotal, descuento, igv, total, creado_en,
  items_pedido ( variante_id, nombre_producto, talla, color_nombre, cantidad, precio_unitario ),
  pagos ( metodo )
`;

// direcciones/perfiles no tienen FK directa hacia `pedidos` que PostgREST
// pueda embeber solo, así que se resuelven con una segunda consulta y se
// arman en memoria — igual que el conteo de categorías en servicioProductos.
async function enriquecerPedidos(filas: FilaPedido[]): Promise<Pedido[]> {
  const cliente = requerirSupabase();
  const idsDireccion = [...new Set(filas.map((f) => f.direccion_id).filter((id): id is string => !!id))];
  const idsUsuario = [...new Set(filas.map((f) => f.usuario_id))];

  const [{ data: filasDireccion }, { data: filasPerfil }] = await Promise.all([
    idsDireccion.length > 0
      ? cliente.from('direcciones').select('id, etiqueta, direccion, distrito, referencia, predeterminada').in('id', idsDireccion)
      : Promise.resolve({ data: [] as unknown[] }),
    idsUsuario.length > 0
      ? cliente.from('perfiles').select('id, nombre').in('id', idsUsuario)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  const mapaDirecciones = new Map(
    (filasDireccion ?? []).map((d) => {
      const t = d as { id: string; etiqueta: string | null; direccion: string; distrito: string | null; referencia: string | null; predeterminada: boolean };
      return [
        t.id,
        {
          id: t.id,
          usuarioId: null,
          etiqueta: t.etiqueta ?? undefined,
          direccion: t.direccion,
          distrito: t.distrito ?? '',
          referencia: t.referencia ?? undefined,
          predeterminada: t.predeterminada,
        } as Direccion,
      ];
    }),
  );
  const mapaNombres = new Map(
    (filasPerfil ?? []).map((p) => {
      const t = p as { id: string; nombre: string | null };
      return [t.id, t.nombre ?? 'Cliente ATRIO'];
    }),
  );

  return filas.map((fila) =>
    mapearPedido(
      fila,
      fila.direccion_id ? mapaDirecciones.get(fila.direccion_id) ?? null : null,
      mapaNombres.get(fila.usuario_id) ?? 'Cliente ATRIO',
    ),
  );
}

export const servicioPedidos = {
  // Sin filtro de usuario: RLS decide qué ve — el cliente solo los suyos, el
  // administrador todos (política ya definida en la auditoría/SQL entregado).
  async obtenerPedidos(): Promise<Pedido[]> {
    const { data, error } = await requerirSupabase()
      .from('pedidos')
      .select(SELECT_PEDIDO)
      .order('creado_en', { ascending: false });
    if (error) throw new Error(`No se pudieron cargar los pedidos: ${error.message}`);
    return enriquecerPedidos((data ?? []) as unknown as FilaPedido[]);
  },

  async obtenerPedidosDeUsuario(usuarioId: string): Promise<Pedido[]> {
    const { data, error } = await requerirSupabase()
      .from('pedidos')
      .select(SELECT_PEDIDO)
      .eq('usuario_id', usuarioId)
      .order('creado_en', { ascending: false });
    if (error) throw new Error(`No se pudieron cargar tus pedidos: ${error.message}`);
    return enriquecerPedidos((data ?? []) as unknown as FilaPedido[]);
  },

  async obtenerPedido(numero: string): Promise<Pedido | null> {
    const { data, error } = await requerirSupabase()
      .from('pedidos')
      .select(SELECT_PEDIDO)
      .eq('numero', numero)
      .maybeSingle();
    if (error) throw new Error(`No se pudo cargar el pedido "${numero}": ${error.message}`);
    if (!data) return null;
    const [pedido] = await enriquecerPedidos([data as unknown as FilaPedido]);
    return pedido;
  },

  async cambiarEstado(numero: string, estado: EstadoPedido): Promise<Pedido> {
    const { error } = await requerirSupabase().from('pedidos').update({ estado }).eq('numero', numero);
    if (error) throw new Error(`No se pudo cambiar el estado del pedido: ${error.message}`);
    const actualizado = await servicioPedidos.obtenerPedido(numero);
    if (!actualizado) throw new Error('El pedido no existe.');
    return actualizado;
  },

  // Única forma de confirmar una compra: todo (validar stock, crear pedido,
  // crear items, descontar stock, registrar movimiento, crear pago, limpiar
  // carrito) pasa por esta única función transaccional en la base — nunca
  // pasos separados desde React Native.
  async confirmarCompra(datos: {
    metodoPago: MetodoPago;
    tipoEntrega: 'envio' | 'retiro';
    direccionId: string | null;
  }): Promise<{ numero: string; total: number }> {
    const { data, error } = await requerirSupabase().rpc('confirmar_compra', {
      p_metodo_pago: datos.metodoPago,
      p_tipo_entrega: datos.tipoEntrega,
      p_direccion_id: datos.direccionId,
    });
    if (error) throw new Error(error.message);
    const fila = Array.isArray(data) ? data[0] : data;
    if (!fila) throw new Error('No se pudo confirmar la compra.');
    return { numero: (fila as { numero: string }).numero, total: (fila as { total: number }).total };
  },

  async obtenerUsuarioId(): Promise<string> {
    return requerirUsuarioId();
  },
};

export type { Pedido };
