export type EtiquetaProducto = 'NUEVO' | '-15%' | 'ÚLTIMAS';

export interface TallaProducto {
  talla: string;
  disponible: boolean;
}

export interface Producto {
  id: string;
  sku: string;
  nombre: string;
  categoriaId: string;
  categoriaNombre: string;
  precio: number;
  precioAnterior?: number;
  descripcion: string;
  composicion: string;
  confeccion: string;
  origen: string;
  imagenes: string[];
  tallas: TallaProducto[];
  stock: number;
  etiquetas: EtiquetaProducto[];
  esNovedad: boolean;
  popularidad30d: number;
  fechaAlta: string;
}
