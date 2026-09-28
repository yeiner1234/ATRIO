import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BotonPrimario } from '@/components/common/BotonPrimario';
import { CampoTexto } from '@/components/common/CampoTexto';
import { ESPACIO } from '@/constants/theme';
import type { DatosTarjeta, MarcaTarjeta } from '@/types';

function marcaSegunNumero(numero: string): MarcaTarjeta {
  if (numero.startsWith('4')) return 'Visa';
  if (numero.startsWith('5')) return 'Mastercard';
  if (numero.startsWith('34') || numero.startsWith('37')) return 'Amex';
  return 'Tarjeta';
}

// "MM/AA" válido y sin vencer (una tarjeta vale hasta el último día de su mes).
function vencimientoValido(vencimiento: string): boolean {
  const partes = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(vencimiento);
  if (!partes) return false;
  const finDeMes = new Date(2000 + Number(partes[2]), Number(partes[1]), 0, 23, 59, 59);
  return finDeMes >= new Date();
}

interface Errores {
  numero?: string;
  titular?: string;
  vencimiento?: string;
}

function validar(numero: string, titular: string, vencimiento: string): Errores {
  const errores: Errores = {};
  if (numero.length < 13 || numero.length > 19) errores.numero = 'Número de tarjeta inválido.';
  if (!titular.trim()) errores.titular = 'Escribe el nombre del titular.';
  if (!vencimientoValido(vencimiento)) errores.vencimiento = 'Fecha inválida o vencida.';
  return errores;
}

interface PropiedadesFormularioTarjeta {
  guardando: boolean;
  alGuardar: (datos: DatosTarjeta) => void;
}

export function FormularioTarjeta({ guardando, alGuardar }: PropiedadesFormularioTarjeta) {
  const [numeroEscrito, setNumeroEscrito] = useState('');
  const [titular, setTitular] = useState('');
  const [mes, setMes] = useState('');
  const [anio, setAnio] = useState('');
  const [intentado, setIntentado] = useState(false);

  const numero = numeroEscrito.replace(/\D/g, '');
  const vencimiento = `${mes.padStart(2, '0')}/${anio}`;
  const errores = intentado ? validar(numero, titular, vencimiento) : {};

  const enviar = () => {
    setIntentado(true);
    if (Object.keys(validar(numero, titular, vencimiento)).length > 0) return;
    // Del número solo se guardan la marca y los últimos 4 dígitos.
    alGuardar({
      titular: titular.trim(),
      marca: marcaSegunNumero(numero),
      ultimos4: numero.slice(-4),
      vencimiento,
      predeterminada: false,
    });
  };

  return (
    <View style={styles.contenedor}>
      <CampoTexto
        etiqueta="Número de tarjeta"
        valor={numeroEscrito}
        alCambiar={setNumeroEscrito}
        placeholder="4242 4242 4242 4242"
        maxLength={23}
        error={errores.numero}
        editable={!guardando}
      />
      <CampoTexto
        etiqueta="Titular"
        valor={titular}
        alCambiar={setTitular}
        placeholder="Como aparece en la tarjeta"
        autoCapitalize="words"
        error={errores.titular}
        editable={!guardando}
      />
      <View style={styles.fila}>
        <View style={styles.mitad}>
          <CampoTexto
            etiqueta="Mes"
            valor={mes}
            alCambiar={setMes}
            placeholder="MM"
            maxLength={2}
            error={errores.vencimiento}
            editable={!guardando}
          />
        </View>
        <View style={styles.mitad}>
          <CampoTexto
            etiqueta="Año"
            valor={anio}
            alCambiar={setAnio}
            placeholder="AA"
            maxLength={2}
            editable={!guardando}
          />
        </View>
      </View>
      <BotonPrimario texto="GUARDAR TARJETA" onPress={enviar} cargando={guardando} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: ESPACIO.base },
  fila: { flexDirection: 'row', gap: ESPACIO.md },
  mitad: { flex: 1 },
});
