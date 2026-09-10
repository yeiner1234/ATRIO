import type { Categoria } from '@/types';

export const categorias: Categoria[] = [
  { id: 'abrigos', nombre: 'Abrigos', conteoArticulos: 2, subcategorias: ['Trench', 'Blazer', 'Abrigo largo'] },
  { id: 'camisas', nombre: 'Camisas', conteoArticulos: 2, subcategorias: ['Popelín', 'Lino', 'Oxford'] },
  { id: 'denim', nombre: 'Denim', conteoArticulos: 1, subcategorias: ['Recto', 'Slim', 'Wide'] },
  { id: 'vestidos', nombre: 'Vestidos', conteoArticulos: 1, subcategorias: ['Midi', 'Largo', 'Corto'] },
  { id: 'punto', nombre: 'Punto', conteoArticulos: 1, subcategorias: ['Jersey', 'Cárdigan', 'Chaleco'] },
  { id: 'faldas', nombre: 'Faldas', conteoArticulos: 1, subcategorias: ['Mini', 'Midi', 'Pana'] },
];
