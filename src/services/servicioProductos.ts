import { categorias } from '@/data/categorias';
import { productos } from '@/data/productos';
import type { Categoria, Producto } from '@/types';

export const servicioProductos = {
  obtenerProductos(): Producto[] {
    return productos;
  },

  obtenerProductoPorId(id: string): Producto | undefined {
    return productos.find((producto) => producto.id === id);
  },

  obtenerNovedades(limite = 4): Producto[] {
    return productos.filter((producto) => producto.esNovedad).slice(0, limite);
  },

  obtenerCategorias(): Categoria[] {
    return categorias;
  },

  obtenerCategoriaPorId(id: string): Categoria | undefined {
    return categorias.find((categoria) => categoria.id === id);
  },
};
