import { useCallback, useState } from 'react';
import { servicioAgente } from '@/services/servicioAgente';
import type { MensajeChat, OrigenAsistente } from '@/types';

const MENSAJE_BIENVENIDA =
  'Hola, soy el asistente de ATRIO. Puedo ayudarte a encontrar productos, consultar tallas, colores, stock y revisar tus pedidos.';

// Cuántos turnos previos se mandan como contexto a la Edge Function — corto
// a propósito para mantener bajo el consumo de tokens (ver punto 18 del
// encargo: historial limitado).
const TURNOS_HISTORIAL = 6;

function nuevoId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function mensajeInicial(): MensajeChat {
  return { id: nuevoId(), rol: 'asistente', texto: MENSAJE_BIENVENIDA, creadoEn: new Date().toISOString() };
}

export function useAgente(origen: OrigenAsistente) {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([mensajeInicial()]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviarMensaje = useCallback(async () => {
    const contenido = texto.trim();
    if (!contenido || enviando) return;

    const mensajeUsuario: MensajeChat = {
      id: nuevoId(),
      rol: 'usuario',
      texto: contenido,
      creadoEn: new Date().toISOString(),
    };

    const historial = [...mensajes, mensajeUsuario]
      .slice(-TURNOS_HISTORIAL)
      .map((m) => ({ rol: m.rol, texto: m.texto }));

    setMensajes((actuales) => [...actuales, mensajeUsuario]);
    setTexto('');
    setError(null);
    setEnviando(true);

    try {
      const respuesta = await servicioAgente.enviarMensaje({ mensaje: contenido, historial, origen });
      const mensajeAsistente: MensajeChat = {
        id: nuevoId(),
        rol: 'asistente',
        texto: respuesta.respuesta || 'No tengo una respuesta para eso todavía.',
        productos: respuesta.productos,
        creadoEn: new Date().toISOString(),
      };
      setMensajes((actuales) => [...actuales, mensajeAsistente]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error al hablar con el asistente.');
    } finally {
      setEnviando(false);
    }
  }, [texto, enviando, mensajes, origen]);

  const limpiarConversacion = useCallback(() => {
    setMensajes([mensajeInicial()]);
    setTexto('');
    setError(null);
  }, []);

  return { mensajes, texto, setTexto, enviando, error, enviarMensaje, limpiarConversacion };
}
