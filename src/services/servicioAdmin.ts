import { supabase } from '@/lib/supabase';
import { servicioProductos } from './servicioProductos';
import type {
  ConteoNombre,
  PedidoReciente,
  ProductoStockBajo,
  ReporteAdmin,
  ResumenDashboardAdmin,
  VentaReciente,
} from '@/types';
import { esStockBajo } from '@/utils/variantes';
import { nombreMetodoPago } from '@/data/metodosPago';
import { servicioPedidos } from './servicioPedidos';

function requerirSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado en este entorno (faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY).',
    );
  }
  return supabase;
}

async function obtenerPedidosDesdeElModuloDePedidos(): Promise<PedidoReciente[]> {
  const pedidos = await servicioPedidos.obtenerPedidos();
  return pedidos.map((pedido) => ({
    id: pedido.numero,
    numero: pedido.numero,
    cliente: pedido.cliente,
    total: pedido.resumen.total,
    estado: pedido.estado,
    fecha: pedido.fecha,
  }));
}

export const servicioAdmin = {
  async obtenerResumenDashboard(): Promise<ResumenDashboardAdmin> {
    const productos = await servicioProductos.obtenerProductos();
    const pedidos = await obtenerPedidosDesdeElModuloDePedidos();

    const totalVentas = pedidos.reduce((acumulado, pedido) => acumulado + pedido.total, 0);
    const totalPedidos = pedidos.length;
    const ticketPromedio = totalPedidos > 0 ? totalVentas / totalPedidos : 0;
    const productosActivos = productos.filter((producto) => producto.activo).length;
    const pedidosPendientes = pedidos.filter(
      (pedido) => pedido.estado === 'preparado' || pedido.estado === 'en_camino',
    ).length;
    const pedidosEntregados = pedidos.filter((pedido) => pedido.estado === 'entregado').length;

    return {
      totalVentas,
      totalPedidos,
      ticketPromedio,
      productosActivos,
      pedidosPendientes,
      pedidosEntregados,
    };
  },

  async obtenerProductosStockBajo(): Promise<ProductoStockBajo[]> {
    const productos = await servicioProductos.obtenerProductos();
    const filas: ProductoStockBajo[] = [];

    for (const producto of productos) {
      if (!producto.activo) continue;
      for (const variante of producto.variantes) {
        if (!esStockBajo(variante.stock)) continue;
        filas.push({
          varianteId: variante.id,
          productoId: producto.id,
          nombre: producto.nombre,
          talla: variante.talla,
          colorId: variante.colorId,
          colorNombre:
            producto.colores.find((color) => color.id === variante.colorId)?.nombre ?? variante.colorId,
          stock: variante.stock,
        });
      }
    }

    return filas.sort((a, b) => a.stock - b.stock);
  },

  async obtenerPedidosRecientes(limite = 5): Promise<PedidoReciente[]> {
    const pedidos = await obtenerPedidosDesdeElModuloDePedidos();
    return [...pedidos]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, limite);
  },

  async obtenerVentasRecientes(limite = 5): Promise<VentaReciente[]> {
    const pedidos = await servicioPedidos.obtenerPedidos();
    return pedidos.slice(0, limite).map((pedido) => ({
      numeroPedido: pedido.numero,
      fecha: pedido.fecha,
      total: pedido.resumen.total,
      metodoPago: nombreMetodoPago(pedido.metodoPago),
      estado: pedido.estado,
    }));
  },

  async obtenerReporteGeneral(): Promise<ReporteAdmin> {
    const pedidos = (await servicioPedidos.obtenerPedidos()).filter((p) => p.estado !== 'cancelado');
    const ventasTotales = pedidos.reduce((acc, p) => acc + p.resumen.total, 0);
    const pedidosTotales = pedidos.length;
    const ticketPromedio = pedidosTotales > 0 ? ventasTotales / pedidosTotales : 0;

    interface FilaItemReporte {
      cantidad: number;
      nombre_producto: string;
      pedidos: { estado: string } | { estado: string }[] | null;
      variantes_producto: {
        productos: { categorias: { nombre: string } | { nombre: string }[] | null } | null;
      } | null;
    }

    const { data, error } = await requerirSupabase()
      .from('items_pedido')
      .select(
        'cantidad, nombre_producto, pedidos!inner ( estado ), variantes_producto ( productos ( categorias ( nombre ) ) )',
      );
    if (error) throw new Error(`No se pudo generar el reporte de ventas: ${error.message}`);

    const conteoProductos = new Map<string, number>();
    const conteoCategorias = new Map<string, number>();

    for (const filaCruda of (data ?? []) as unknown as FilaItemReporte[]) {
      const pedidoRelacionado = Array.isArray(filaCruda.pedidos) ? filaCruda.pedidos[0] : filaCruda.pedidos;
      if (pedidoRelacionado?.estado === 'cancelado') continue;

      conteoProductos.set(
        filaCruda.nombre_producto,
        (conteoProductos.get(filaCruda.nombre_producto) ?? 0) + filaCruda.cantidad,
      );

      const categoriaFila = filaCruda.variantes_producto?.productos?.categorias;
      const categoria = Array.isArray(categoriaFila) ? categoriaFila[0] : categoriaFila;
      if (categoria?.nombre) {
        conteoCategorias.set(categoria.nombre, (conteoCategorias.get(categoria.nombre) ?? 0) + filaCruda.cantidad);
      }
    }

    const aLista = (mapa: Map<string, number>): ConteoNombre[] =>
      [...mapa.entries()]
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);

    return {
      ventasTotales,
      pedidosTotales,
      ticketPromedio,
      productosMasVendidos: aLista(conteoProductos),
      categoriasMasVendidas: aLista(conteoCategorias),
    };
  },
};
