export type RolMensajeChat = 'usuario' | 'asistente';

export type OrigenAsistente = 'inicio' | 'catalogo';

export interface ProductoChatResultado {
  id: string;
  nombre: string;
  precio: number;
  imagen: string | null;
  colores: string[];
  tallasDisponibles: string[];
}

export interface MensajeChat {
  id: string;
  rol: RolMensajeChat;
  texto: string;
  productos?: ProductoChatResultado[];
  creadoEn: string;
}
