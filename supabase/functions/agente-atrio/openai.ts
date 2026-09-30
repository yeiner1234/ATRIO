// Modelo configurable por secreto de Supabase (`OPENAI_MODEL`). El nombre
// pedido por Yeiner es "GPT-5.6 Luna": no es un id de modelo publicado por
// OpenAI al momento de escribir esto, así que se deja como valor por
// defecto configurable — si OpenAI cambia el id real, se actualiza el
// secreto sin tocar código. Ver auditoría final.
const MODELO_POR_DEFECTO = 'gpt-5.6-luna';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export interface MensajeOpenAI {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: {
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }[];
  tool_call_id?: string;
}

interface RespuestaChatCompletion {
  choices: { message: MensajeOpenAI }[];
}

export async function llamarOpenAI(params: {
  apiKey: string;
  mensajes: MensajeOpenAI[];
  tools: unknown[];
}): Promise<MensajeOpenAI> {
  const modelo = Deno.env.get('OPENAI_MODEL') || MODELO_POR_DEFECTO;

  const respuesta = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelo,
      messages: params.mensajes,
      tools: params.tools.length > 0 ? params.tools : undefined,
      tool_choice: params.tools.length > 0 ? 'auto' : undefined,
      max_tokens: 500,
      temperature: 0.3,
    }),
  });

  if (!respuesta.ok) {
    const texto = await respuesta.text().catch(() => '');
    // El mensaje queda en los logs de la function (nunca se devuelve tal
    // cual al cliente RN, ver index.ts) — incluye status, cuerpo y el
    // modelo usado para poder diagnosticar sin tener que adivinar cuál de
    // los dos secretos falló. Nunca incluye la API key.
    throw new Error(`OpenAI respondió ${respuesta.status} (modelo "${modelo}"): ${texto.slice(0, 300)}`);
  }

  const datos = (await respuesta.json()) as RespuestaChatCompletion;
  const mensaje = datos.choices?.[0]?.message;
  if (!mensaje) throw new Error('OpenAI no devolvió una respuesta utilizable.');
  return mensaje;
}
