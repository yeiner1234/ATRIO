import { supabase } from '@/lib/supabase';
import type { OrigenAsistente, ProductoChatResultado } from '@/types';

const TIMEOUT_MS = 20000;

function requerirSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado en este entorno (faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY).',
    );
  }
  return supabase;
}

export interface MensajeHistorial {
  rol: 'usuario' | 'asistente';
  texto: string;
}

export interface RespuestaAgente {
  respuesta: string;
  productos?: ProductoChatResultado[];
}

interface RespuestaEdgeFunction {
  respuesta?: string;
  productos?: ProductoChatResultado[];
  error?: string;
}

// Único punto de contacto con la Edge Function `agente-atrio`. No conoce
// nada de OpenAI: solo envía el mensaje + historial corto + origen de
// pantalla, y traduce la respuesta o el error a algo que useAgente entienda.
export const servicioAgente = {
  async enviarMensaje(datos: {
    mensaje: string;
    historial: MensajeHistorial[];
    origen: OrigenAsistente;
  }): Promise<RespuestaAgente> {
    const cliente = requerirSupabase();

    const { data, error } = await cliente.functions.invoke<RespuestaEdgeFunction>('agente-atrio', {
      body: {
        mensaje: datos.mensaje,
        historial: datos.historial,
        origen: datos.origen,
      },
      timeout: TIMEOUT_MS,
    });

    if (error) {
      throw new Error(
        error.message === 'Failed to fetch' || error.name === 'FunctionsFetchError'
          ? 'No se pudo contactar al asistente. Revisa tu conexión a internet.'
          : `El asistente no pudo responder: ${error.message}`,
      );
    }

    if (!data || data.error) {
      throw new Error(data?.error ?? 'El asistente no devolvió una respuesta válida.');
    }

    return { respuesta: data.respuesta ?? '', productos: data.productos };
  },
};
