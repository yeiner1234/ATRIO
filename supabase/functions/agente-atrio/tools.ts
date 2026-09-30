import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

// Umbral de stock bajo: mismo criterio simple que usa el panel admin del
// cliente (src/utils/variantes.ts) — una variante con stock <= 5 se
// considera "stock bajo".
const UMBRAL_STOCK_BAJO = 5;
const LIMITE_RESULTADOS_BUSQUEDA = 8;

export interface ContextoAgente {
  supabase: SupabaseClient;
  usuarioId: string | null;
  esAdmin: boolean;
}

interface ProductoTarjeta {
  id: string;
  nombre: string;
  precio: number;
  imagen: string | null;
  colores: string[];
  tallasDisponibles: string[];
}

// Todas las tools son consultas predefinidas de solo lectura: ningún
// parámetro llega a SQL libre, y cada ejecutor vuelve a validar
// autorización (usuarioId / esAdmin) aunque el tool ya se haya filtrado al
// armar la lista que se manda a OpenAI — defensa en profundidad.
type EjecutorTool = (args: Record<string, unknown>, ctx: ContextoAgente) => Promise<unknown>;

function textoSeguro(valor: unknown): string | undefined {
  return typeof valor === 'string' && valor.trim().length > 0 ? valor.trim() : undefined;
}

function numeroSeguro(valor: unknown): number | undefined {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : undefined;
}

function productoATarjeta(fila: {
  id: string;
  nombre: string;
  precio: number;
  imagenes_producto: { url: string; orden: number }[] | null;
  variantes_producto: { talla: string; stock: number; colores: { nombre: string } | null }[] | null;
}): ProductoTarjeta {
  const imagenes = [...(fila.imagenes_producto ?? [])].sort((a, b) => a.orden - b.orden);
  const variantes = fila.variantes_producto ?? [];
  const colores = [...new Set(variantes.map((v) => v.colores?.nombre).filter((n): n is string => !!n))];
  const tallasDisponibles = [
    ...new Set(variantes.filter((v) => v.stock > 0).map((v) => v.talla)),
  ];

  return {
    id: fila.id,
    nombre: fila.nombre,
    precio: fila.precio,
    imagen: imagenes[0]?.url ?? null,
    colores,
    tallasDisponibles,
  };
}

const SELECT_TARJETA = `
  id, nombre, precio,
  imagenes_producto ( url, orden ),
  variantes_producto ( talla, stock, colores ( nombre ) )
`;

const buscarProductos: EjecutorTool = async (args, ctx) => {
  const texto = textoSeguro(args.texto);
  const categoria = textoSeguro(args.categoria);
  const color = textoSeguro(args.color);
  const talla = textoSeguro(args.talla);
  const precioMaximo = numeroSeguro(args.precioMaximo);
  const soloDisponibles = args.soloDisponibles !== false;

  let idsPorVariante: string[] | null = null;
  if (color || talla) {
    let consulta = ctx.supabase
      .from('variantes_producto')
      .select('producto_id, talla, stock, colores ( nombre )');
    if (talla) consulta = consulta.ilike('talla', talla);
    if (soloDisponibles) consulta = consulta.gt('stock', 0);
    const { data, error } = await consulta.limit(200);
    if (error) return { error: `No se pudo filtrar por talla/color: ${error.message}` };

    let filas = (data ?? []) as { producto_id: string; colores: { nombre: string } | null }[];
    if (color) {
      const colorMin = color.toLowerCase();
      filas = filas.filter((f) => (f.colores?.nombre ?? '').toLowerCase().includes(colorMin));
    }
    idsPorVariante = [...new Set(filas.map((f) => f.producto_id))];
    if (idsPorVariante.length === 0) return { productos: [] };
  }

  let consultaProductos = ctx.supabase.from('productos').select(SELECT_TARJETA).eq('activo', true);
  if (texto) consultaProductos = consultaProductos.ilike('nombre', `%${texto}%`);
  if (precioMaximo !== undefined) consultaProductos = consultaProductos.lte('precio', precioMaximo);
  if (idsPorVariante) consultaProductos = consultaProductos.in('id', idsPorVariante);

  if (categoria) {
    const { data: categorias } = await ctx.supabase
      .from('categorias')
      .select('id')
      .ilike('nombre', `%${categoria}%`);
    const idsCategoria = (categorias ?? []).map((c) => (c as { id: string }).id);
    if (idsCategoria.length === 0) return { productos: [] };
    consultaProductos = consultaProductos.in('categoria_id', idsCategoria);
  }

  const { data, error } = await consultaProductos
    .order('popularidad_30d', { ascending: false })
    .limit(LIMITE_RESULTADOS_BUSQUEDA);
  if (error) return { error: `No se pudieron buscar productos: ${error.message}` };

  const productos = ((data ?? []) as never[]).map((fila) => productoATarjeta(fila as never));
  return { productos };
};

const consultarProducto: EjecutorTool = async (args, ctx) => {
  const id = textoSeguro(args.id);
  const nombre = textoSeguro(args.nombre);
  if (!id && !nombre) return { error: 'Falta indicar id o nombre del producto.' };

  let consulta = ctx.supabase
    .from('productos')
    .select(`${SELECT_TARJETA}, descripcion, composicion`)
    .eq('activo', true);
  consulta = id ? consulta.eq('id', id) : consulta.ilike('nombre', `%${nombre}%`);

  const { data, error } = await consulta.limit(1).maybeSingle();
  if (error) return { error: `No se pudo consultar el producto: ${error.message}` };
  if (!data) return { encontrado: false };

  const tarjeta = productoATarjeta(data as never);
  const extra = data as unknown as { descripcion: string; composicion: string };
  return {
    encontrado: true,
    producto: { ...tarjeta, descripcion: extra.descripcion.slice(0, 300), composicion: extra.composicion },
  };
};

const consultarStock: EjecutorTool = async (args, ctx) => {
  const productoId = textoSeguro(args.productoId);
  const nombre = textoSeguro(args.nombre);
  const talla = textoSeguro(args.talla);
  const color = textoSeguro(args.color);
  if (!productoId && !nombre) return { error: 'Falta indicar productoId o nombre del producto.' };

  let idProducto = productoId;
  if (!idProducto) {
    const { data } = await ctx.supabase
      .from('productos')
      .select('id')
      .ilike('nombre', `%${nombre}%`)
      .limit(1)
      .maybeSingle();
    if (!data) return { encontrado: false, mensaje: 'No encontré ese producto.' };
    idProducto = (data as { id: string }).id;
  }

  const { data, error } = await ctx.supabase
    .from('variantes_producto')
    .select('talla, stock, colores ( nombre )')
    .eq('producto_id', idProducto)
    .limit(50);
  if (error) return { error: `No se pudo consultar el stock: ${error.message}` };

  let filas = (data ?? []) as { talla: string; stock: number; colores: { nombre: string } | null }[];
  if (talla) filas = filas.filter((f) => f.talla.toLowerCase() === talla.toLowerCase());
  if (color) {
    const colorMin = color.toLowerCase();
    filas = filas.filter((f) => (f.colores?.nombre ?? '').toLowerCase().includes(colorMin));
  }

  return {
    variantes: filas.map((f) => ({ talla: f.talla, color: f.colores?.nombre ?? null, stock: f.stock })),
  };
};

const obtenerMisPedidos: EjecutorTool = async (_args, ctx) => {
  if (!ctx.usuarioId) return { error: 'Debes iniciar sesión para consultar tus pedidos.' };

  const { data, error } = await ctx.supabase
    .from('pedidos')
    .select('numero, estado, total, creado_en')
    .eq('usuario_id', ctx.usuarioId)
    .order('creado_en', { ascending: false })
    .limit(5);
  if (error) return { error: `No se pudieron cargar tus pedidos: ${error.message}` };
  return { pedidos: data ?? [] };
};

const obtenerDetallePedido: EjecutorTool = async (args, ctx) => {
  if (!ctx.usuarioId) return { error: 'Debes iniciar sesión para consultar un pedido.' };
  const numero = textoSeguro(args.numero);
  if (!numero) return { error: 'Falta indicar el número de pedido.' };

  // Sin filtro manual de usuario_id: RLS ya restringe (cliente solo el
  // suyo, administrador cualquiera) — igual que servicioPedidos en la app.
  const { data, error } = await ctx.supabase
    .from('pedidos')
    .select(
      'numero, estado, total, subtotal, descuento, igv, creado_en, tipo_entrega, items_pedido ( nombre_producto, talla, color_nombre, cantidad, precio_unitario )',
    )
    .eq('numero', numero)
    .maybeSingle();
  if (error) return { error: `No se pudo cargar el pedido: ${error.message}` };
  if (!data) return { encontrado: false };
  return { encontrado: true, pedido: data };
};

const obtenerProductosStockBajo: EjecutorTool = async (_args, ctx) => {
  if (!ctx.esAdmin) return { error: 'No tienes permisos para esa consulta.' };

  const { data, error } = await ctx.supabase
    .from('variantes_producto')
    .select('talla, stock, producto_id, colores ( nombre ), productos!inner ( nombre, activo )')
    .lte('stock', UMBRAL_STOCK_BAJO)
    .eq('productos.activo', true)
    .order('stock', { ascending: true })
    .limit(10);
  if (error) return { error: `No se pudo cargar stock bajo: ${error.message}` };

  const filas = (data ?? []) as unknown as {
    talla: string;
    stock: number;
    colores: { nombre: string } | null;
    productos: { nombre: string } | null;
  }[];
  return {
    productos: filas.map((f) => ({
      producto: f.productos?.nombre ?? '',
      talla: f.talla,
      color: f.colores?.nombre ?? null,
      stock: f.stock,
    })),
  };
};

const obtenerResumenVentas: EjecutorTool = async (_args, ctx) => {
  if (!ctx.esAdmin) return { error: 'No tienes permisos para esa consulta.' };

  const { data, error } = await ctx.supabase
    .from('pedidos')
    .select('total, estado')
    .neq('estado', 'cancelado')
    .limit(500);
  if (error) return { error: `No se pudo calcular el resumen de ventas: ${error.message}` };

  const filas = (data ?? []) as { total: number; estado: string }[];
  const totalVentas = filas.reduce((acc, f) => acc + f.total, 0);
  const totalPedidos = filas.length;
  const entregados = filas.filter((f) => f.estado === 'entregado').length;

  return {
    totalVentas: Number(totalVentas.toFixed(2)),
    totalPedidos,
    ticketPromedio: totalPedidos > 0 ? Number((totalVentas / totalPedidos).toFixed(2)) : 0,
    pedidosEntregados: entregados,
  };
};

const obtenerPedidosRecientes: EjecutorTool = async (args, ctx) => {
  if (!ctx.esAdmin) return { error: 'No tienes permisos para esa consulta.' };
  const limite = Math.min(numeroSeguro(args.limite) ?? 5, 10);

  const { data, error } = await ctx.supabase
    .from('pedidos')
    .select('numero, estado, total, creado_en, usuario_id')
    .order('creado_en', { ascending: false })
    .limit(limite);
  if (error) return { error: `No se pudieron cargar los pedidos recientes: ${error.message}` };
  return { pedidos: data ?? [] };
};

export const EJECUTORES: Record<string, EjecutorTool> = {
  buscarProductos,
  consultarProducto,
  consultarStock,
  obtenerMisPedidos,
  obtenerDetallePedido,
  obtenerProductosStockBajo,
  obtenerResumenVentas,
  obtenerPedidosRecientes,
};

// Definiciones en formato "tools" de OpenAI. `construirDefinicionesTools`
// solo incluye lo que el usuario actual puede usar: los tools de pedidos
// exigen sesión, los de admin exigen rol administrador — así GPT ni se
// entera de que existen si no aplica (además de que el ejecutor los
// rechaza igual si se intentaran).
export function construirDefinicionesTools(ctx: { usuarioId: string | null; esAdmin: boolean }) {
  const base = [
    {
      type: 'function' as const,
      function: {
        name: 'buscarProductos',
        description: 'Busca productos del catálogo de ATRIO por texto, categoría, color, talla o precio máximo.',
        parameters: {
          type: 'object',
          properties: {
            texto: { type: 'string', description: 'Texto libre a buscar en el nombre del producto.' },
            categoria: { type: 'string', description: 'Nombre de categoría (ej. "polos", "pantalones").' },
            color: { type: 'string', description: 'Color deseado (ej. "negro").' },
            talla: { type: 'string', description: 'Talla deseada (ej. "M").' },
            precioMaximo: { type: 'number', description: 'Precio máximo en soles.' },
            soloDisponibles: { type: 'boolean', description: 'Si es true (por defecto), solo variantes con stock.' },
          },
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'consultarProducto',
        description: 'Obtiene el detalle de un producto específico por id o por nombre.',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nombre: { type: 'string' },
          },
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'consultarStock',
        description:
          'Consulta el stock real de un producto por talla y color, usando la combinación oficial producto+talla+color de variantes_producto.',
        parameters: {
          type: 'object',
          properties: {
            productoId: { type: 'string' },
            nombre: { type: 'string', description: 'Nombre del producto si no se conoce el id.' },
            talla: { type: 'string' },
            color: { type: 'string' },
          },
        },
      },
    },
  ];

  const pedidos = ctx.usuarioId
    ? [
        {
          type: 'function' as const,
          function: {
            name: 'obtenerMisPedidos',
            description: 'Devuelve los pedidos del usuario autenticado actual (nunca de otros usuarios).',
            parameters: { type: 'object', properties: {} },
          },
        },
        {
          type: 'function' as const,
          function: {
            name: 'obtenerDetallePedido',
            description: 'Devuelve el detalle de un pedido del usuario autenticado por número de pedido.',
            parameters: {
              type: 'object',
              properties: { numero: { type: 'string' } },
              required: ['numero'],
            },
          },
        },
      ]
    : [];

  const admin = ctx.esAdmin
    ? [
        {
          type: 'function' as const,
          function: {
            name: 'obtenerProductosStockBajo',
            description: 'Solo administrador: lista variantes de producto con stock bajo.',
            parameters: { type: 'object', properties: {} },
          },
        },
        {
          type: 'function' as const,
          function: {
            name: 'obtenerResumenVentas',
            description: 'Solo administrador: resumen de ventas (total, pedidos, ticket promedio).',
            parameters: { type: 'object', properties: {} },
          },
        },
        {
          type: 'function' as const,
          function: {
            name: 'obtenerPedidosRecientes',
            description: 'Solo administrador: lista los pedidos más recientes de todos los usuarios.',
            parameters: {
              type: 'object',
              properties: { limite: { type: 'number', description: 'Máximo 10.' } },
            },
          },
        },
      ]
    : [];

  return [...base, ...pedidos, ...admin];
}
