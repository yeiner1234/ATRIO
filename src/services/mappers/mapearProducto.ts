import type { ColorProducto, EtiquetaProducto, Producto, VarianteProducto } from '@/types';

export interface FilaColorSupabase {
  id: string;
  nombre: string;
  hex: string;
}

export interface FilaVarianteSupabase {
  id: string;
  talla: string;
  color_id: string;
  stock: number;
  colores: FilaColorSupabase | null;
}

export interface FilaImagenSupabase {
  id: string;
  url: string;
  orden: number;
}

export interface FilaCategoriaEmbebidaSupabase {
  id: string;
  nombre: string;
}

export interface FilaProductoSupabase {
  id: string;
  sku: string;
  nombre: string;
  categoria_id: string;
  precio: number;
  precio_anterior: number | null;
  descripcion: string;
  composicion: string;
  confeccion: string;
  origen: string;
  etiquetas: string[] | null;
  es_novedad: boolean;
  popularidad_30d: number;
  fecha_alta: string;
  activo: boolean;
  categorias: FilaCategoriaEmbebidaSupabase | null;
  variantes_producto: FilaVarianteSupabase[] | null;
  imagenes_producto: FilaImagenSupabase[] | null;
}

/** Las variantes traen su color embebido; de ahí se deriva producto.colores, sin duplicados. */
function coloresDesdeVariantes(variantes: VarianteProducto[], filas: FilaVarianteSupabase[]): ColorProducto[] {
  const vistos = new Set<string>();
  const resultado: ColorProducto[] = [];
  for (const fila of filas) {
    if (!fila.colores || vistos.has(fila.colores.id)) continue;
    vistos.add(fila.colores.id);
    resultado.push({ id: fila.colores.id, nombre: fila.colores.nombre, hex: fila.colores.hex });
  }
  void variantes;
  return resultado;
}

/** Reconstruye el `Producto` de la app desde la fila anidada de Supabase. */
export function mapearProducto(fila: FilaProductoSupabase): Producto {
  const filasVariantes = fila.variantes_producto ?? [];
  const filasImagenes = fila.imagenes_producto ?? [];

  const variantes: VarianteProducto[] = filasVariantes.map((v) => ({
    id: v.id,
    talla: v.talla,
    colorId: v.color_id,
    stock: v.stock,
  }));

  const imagenes = [...filasImagenes]
    .sort((a, b) => a.orden - b.orden)
    .map((imagen) => imagen.url);

  return {
    id: fila.id,
    sku: fila.sku,
    nombre: fila.nombre,
    categoriaId: fila.categoria_id,
    categoriaNombre: fila.categorias?.nombre ?? '',
    precio: fila.precio,
    precioAnterior: fila.precio_anterior ?? undefined,
    descripcion: fila.descripcion,
    composicion: fila.composicion,
    confeccion: fila.confeccion,
    origen: fila.origen,
    imagenes,
    colores: coloresDesdeVariantes(variantes, filasVariantes),
    variantes,
    etiquetas: (fila.etiquetas ?? []) as EtiquetaProducto[],
    esNovedad: fila.es_novedad,
    popularidad30d: fila.popularidad_30d,
    fechaAlta: fila.fecha_alta,
    activo: fila.activo,
  };
}
