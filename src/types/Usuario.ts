// Valores exactos del CHECK real de la columna perfiles.rol en Supabase — no mezclar con 'admin'/'propietaria'.
export type RolUsuario = 'cliente' | 'administrador';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  celular: string;
  rol: RolUsuario;
}