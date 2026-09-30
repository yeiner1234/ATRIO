import { File } from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import type { Categoria, ColorProducto, DatosProductoGenerales, Producto, VarianteProducto } from '@/types';
import { mapearProducto, type FilaProductoSupabase } from './mappers/mapearProducto';

const BUCKET_IMAGENES_PRODUCTO = 'productos';

const SELECT_PRODUCTO = `
  id, sku, nombre, categoria_id, precio, precio_anterior, descripcion, composicion,
  confeccion, origen, etiquetas, es_novedad, popularidad_30d, fecha_alta, activo,
  categorias ( id, nombre ),
  variantes_producto ( id, talla, color_id, stock, colores ( id, nombre, hex ) ),
  imagenes_producto ( id, url, orden )
`;

function requerirSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado en este entorno (faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY).',
    );
  }
  return supabase;
}

function generarIdProducto(nombre: string): string {
  const base = nombre
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
  return `${base || 'producto'}-${Date.now().toString(36)}`;
}

async function obtenerProductoPorIdInterno(id: string): Promise<Producto | undefined> {
  const { data, error } = await requerirSupabase()
    .from('productos')
    .select(SELECT_PRODUCTO)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`No se pudo cargar el producto "${id}": ${error.message}`);
  return data ? mapearProducto(data as unknown as FilaProductoSupabase) : undefined;
}

export const servicioProductos = {
  async obtenerProductos(): Promise<Producto[]> {
    const { data, error } = await requerirSupabase()
      .from('productos')
      .select(SELECT_PRODUCTO)
      .order('fecha_alta', { ascending: false });

    if (error) throw new Error(`No se pudieron cargar los productos: ${error.message}`);
    return (data ?? []).map((fila) => mapearProducto(fila as unknown as FilaProductoSupabase));
  },

  async obtenerProductoPorId(id: string): Promise<Producto | undefined> {
    return obtenerProductoPorIdInterno(id);
  },

  async obtenerNovedades(limite = 4): Promise<Producto[]> {
    const { data, error } = await requerirSupabase()
      .from('productos')
      .select(SELECT_PRODUCTO)
      .eq('es_novedad', true)
      .order('fecha_alta', { ascending: false })
      .limit(limite);

    if (error) throw new Error(`No se pudieron cargar las novedades: ${error.message}`);
    return (data ?? []).map((fila) => mapearProducto(fila as unknown as FilaProductoSupabase));
  },

  async obtenerCategorias(): Promise<Categoria[]> {
    const cliente = requerirSupabase();
    const [{ data: filasCategorias, error: errorCategorias }, { data: filasProductos, error: errorProductos }] =
      await Promise.all([
        cliente.from('categorias').select('id, nombre, subcategorias, imagen_url'),
        cliente.from('productos').select('categoria_id'),
      ]);

    if (errorCategorias) throw new Error(`No se pudieron cargar las categorías: ${errorCategorias.message}`);
    if (errorProductos) throw new Error(`No se pudo calcular el conteo por categoría: ${errorProductos.message}`);

    const conteos = new Map<string, number>();
    for (const fila of filasProductos ?? []) {
      const clave = (fila as { categoria_id: string }).categoria_id;
      conteos.set(clave, (conteos.get(clave) ?? 0) + 1);
    }

    return (filasCategorias ?? []).map((fila) => {
      const tipada = fila as {
        id: string;
        nombre: string;
        subcategorias: string[] | null;
        imagen_url: string | null;
      };
      return {
        id: tipada.id,
        nombre: tipada.nombre,
        subcategorias: tipada.subcategorias ?? [],
        conteoArticulos: conteos.get(tipada.id) ?? 0,
        imagenUrl: tipada.imagen_url ?? undefined,
      };
    });
  },

  async obtenerCategoriaPorId(id: string): Promise<Categoria | undefined> {
    const categorias = await servicioProductos.obtenerCategorias();
    return categorias.find((categoria) => categoria.id === id);
  },

  async obtenerColores(): Promise<ColorProducto[]> {
    const { data, error } = await requerirSupabase().from('colores').select('id, nombre, hex');
    if (error) throw new Error(`No se pudieron cargar los colores: ${error.message}`);
    return (data ?? []) as ColorProducto[];
  },

  async subirImagen(uri: string, contentType = 'image/jpeg'): Promise<string> {
    const cliente = requerirSupabase();
    const extension = contentType.split('/')[1] ?? 'jpg';
    const ruta = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    const archivo = new File(uri);
    const bytes = await archivo.arrayBuffer();

    const { error } = await cliente.storage.from(BUCKET_IMAGENES_PRODUCTO).upload(ruta, bytes, { contentType });
    if (error) throw new Error(`No se pudo subir la foto: ${error.message}`);

    const { data } = cliente.storage.from(BUCKET_IMAGENES_PRODUCTO).getPublicUrl(ruta);
    return data.publicUrl;
  },

  async crearProducto(
    datos: DatosProductoGenerales & { variantes: VarianteProducto[]; imagenes: string[] },
  ): Promise<Producto> {
    const cliente = requerirSupabase();
    const id = generarIdProducto(datos.nombre);

    const { error: errorProducto } = await cliente.from('productos').insert({
      id,
      sku: datos.sku,
      nombre: datos.nombre,
      categoria_id: datos.categoriaId,
      precio: datos.precio,
      precio_anterior: datos.precioAnterior ?? null,
      descripcion: datos.descripcion,
      composicion: datos.composicion,
      confeccion: datos.confeccion,
      origen: datos.origen,
      etiquetas: datos.etiquetas,
      es_novedad: datos.esNovedad,
      popularidad_30d: 0,
      fecha_alta: new Date().toISOString().slice(0, 10),
      activo: true,
    });
    if (errorProducto) {
      if (errorProducto.code === '23505') {
        throw new Error(`Ya existe un producto con el SKU "${datos.sku}".`);
      }
      throw new Error(`No se pudo crear el producto: ${errorProducto.message}`);
    }

    if (datos.variantes.length > 0) {
      const { error: errorVariantes } = await cliente.from('variantes_producto').insert(
        datos.variantes.map((v) => ({ producto_id: id, talla: v.talla, color_id: v.colorId, stock: v.stock })),
      );
      if (errorVariantes) {
        throw new Error(`El producto se creó, pero no se pudieron guardar las variantes: ${errorVariantes.message}`);
      }
    }

    if (datos.imagenes.length > 0) {
      const { error: errorImagenes } = await cliente.from('imagenes_producto').insert(
        datos.imagenes.map((url, orden) => ({ producto_id: id, url, orden })),
      );
      if (errorImagenes) {
        throw new Error(`El producto se creó, pero no se pudieron guardar las fotos: ${errorImagenes.message}`);
      }
    }

    const creado = await obtenerProductoPorIdInterno(id);
    if (!creado) throw new Error('El producto se creó pero no se pudo volver a leer.');
    return creado;
  },

  async actualizarProducto(id: string, datos: DatosProductoGenerales): Promise<Producto> {
    const cliente = requerirSupabase();
    const { error } = await cliente
      .from('productos')
      .update({
        nombre: datos.nombre,
        categoria_id: datos.categoriaId,
        precio: datos.precio,
        precio_anterior: datos.precioAnterior ?? null,
        descripcion: datos.descripcion,
        composicion: datos.composicion,
        confeccion: datos.confeccion,
        origen: datos.origen,
        etiquetas: datos.etiquetas,
        es_novedad: datos.esNovedad,
      })
      .eq('id', id);
    if (error) throw new Error(`No se pudo actualizar el producto: ${error.message}`);

    const actualizado = await obtenerProductoPorIdInterno(id);
    if (!actualizado) throw new Error(`El producto "${id}" no existe.`);
    return actualizado;
  },

  async actualizarVariantesEImagenes(
    id: string,
    variantes: VarianteProducto[],
    imagenes: string[],
  ): Promise<Producto> {
    const cliente = requerirSupabase();
    const { data: usuarioActual } = await cliente.auth.getUser();
    const creadoPor = usuarioActual.user?.id ?? null;

    const { data: existentes, error: errorLectura } = await cliente
      .from('variantes_producto')
      .select('id, talla, color_id, stock')
      .eq('producto_id', id);
    if (errorLectura) throw new Error(`No se pudieron leer las variantes actuales: ${errorLectura.message}`);

    const clave = (talla: string, colorId: string) => `${talla}__${colorId}`;
    const mapaExistentes = new Map(
      ((existentes ?? []) as { id: string; talla: string; color_id: string; stock: number }[]).map((v) => [
        clave(v.talla, v.color_id),
        v,
      ]),
    );
    const clavesNuevas = new Set(variantes.map((v) => clave(v.talla, v.colorId)));
    const movimientos: { variante_id: string; tipo: 'ingreso' | 'ajuste'; cantidad: number; creado_por: string | null }[] = [];

    for (const variante of variantes) {
      const existente = mapaExistentes.get(clave(variante.talla, variante.colorId));
      if (!existente) {
        const { data: creada, error } = await cliente
          .from('variantes_producto')
          .insert({ producto_id: id, talla: variante.talla, color_id: variante.colorId, stock: variante.stock })
          .select('id')
          .single();
        if (error) throw new Error(`No se pudo crear la variante ${variante.talla}/${variante.colorId}: ${error.message}`);
        if (variante.stock > 0) {
          movimientos.push({ variante_id: (creada as { id: string }).id, tipo: 'ingreso', cantidad: variante.stock, creado_por: creadoPor });
        }
      } else if (existente.stock !== variante.stock) {
        const { error } = await cliente
          .from('variantes_producto')
          .update({ stock: variante.stock })
          .eq('id', existente.id);
        if (error) throw new Error(`No se pudo actualizar el stock de ${variante.talla}/${variante.colorId}: ${error.message}`);
        movimientos.push({
          variante_id: existente.id,
          tipo: 'ajuste',
          cantidad: variante.stock - existente.stock,
          creado_por: creadoPor,
        });
      }
    }

    const idsAEliminar = [...mapaExistentes.entries()]
      .filter(([claveExistente]) => !clavesNuevas.has(claveExistente))
      .map(([, v]) => v.id);
    if (idsAEliminar.length > 0) {
      const { error: errorEliminar } = await cliente.from('variantes_producto').delete().in('id', idsAEliminar);
      if (errorEliminar) {
        throw new Error(
          `No se pudieron quitar algunas variantes (puede que ya tengan pedidos asociados): ${errorEliminar.message}`,
        );
      }
    }

    if (movimientos.length > 0) {
      const { error: errorMovimientos } = await cliente.from('movimientos_stock').insert(
        movimientos.map((m) => ({ variante_id: m.variante_id, tipo: m.tipo, cantidad: m.cantidad, creado_por: m.creado_por })),
      );
      if (errorMovimientos) console.error('No se pudo registrar el movimiento de stock.', errorMovimientos);
    }

    const { error: errorBorrarImagenes } = await cliente
      .from('imagenes_producto')
      .delete()
      .eq('producto_id', id);
    if (errorBorrarImagenes) {
      throw new Error(`No se pudieron actualizar las fotos: ${errorBorrarImagenes.message}`);
    }
    if (imagenes.length > 0) {
      const { error: errorImagenes } = await cliente.from('imagenes_producto').insert(
        imagenes.map((url, orden) => ({ producto_id: id, url, orden })),
      );
      if (errorImagenes) throw new Error(`No se pudieron guardar las fotos: ${errorImagenes.message}`);
    }

    const actualizado = await obtenerProductoPorIdInterno(id);
    if (!actualizado) throw new Error(`El producto "${id}" no existe.`);
    return actualizado;
  },

  async alternarActivo(id: string): Promise<Producto> {
    const actual = await obtenerProductoPorIdInterno(id);
    if (!actual) throw new Error(`El producto "${id}" no existe.`);

    const cliente = requerirSupabase();
    const { error } = await cliente.from('productos').update({ activo: !actual.activo }).eq('id', id);
    if (error) throw new Error(`No se pudo cambiar el estado del producto: ${error.message}`);

    const actualizado = await obtenerProductoPorIdInterno(id);
    if (!actualizado) throw new Error(`El producto "${id}" no existe.`);
    return actualizado;
  },
};
