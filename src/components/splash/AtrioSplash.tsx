import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { useSplashBootstrap } from '@/hooks/useSplashBootstrap';

const ANCHO_BARRA = 120;
const ANCHO_RELLENO_BARRA = 40;

export function AtrioSplash() {
  const { fase, fuentesListas, abrirTiendaParaActualizar } = useSplashBootstrap();

  const opacidad = useRef(new Animated.Value(0)).current;
  const escala = useRef(new Animated.Value(0)).current;
  const aparicionSecundaria = useRef(new Animated.Value(0)).current;
  const desplazamiento = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!fuentesListas) return;

    Animated.parallel([
      Animated.timing(opacidad, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(escala, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.back(1.3)),
        useNativeDriver: true,
      }),
      Animated.timing(aparicionSecundaria, {
        toValue: 1,
        duration: 500,
        delay: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    const bucleBarra = Animated.loop(
      Animated.timing(desplazamiento, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    bucleBarra.start();
    return () => bucleBarra.stop();
  }, [fuentesListas, opacidad, escala, aparicionSecundaria, desplazamiento]);

  if (!fuentesListas) return null;

  const desplazamientoRelleno = desplazamiento.interpolate({
    inputRange: [0, 1],
    outputRange: [-ANCHO_RELLENO_BARRA, ANCHO_BARRA],
  });

  if (fase === 'actualizacion-requerida') {
    return (
      <View style={estilos.contenedor}>
        <StatusBar style="light" />
        <View style={estilos.contenido}>
          <Text style={estilos.wordmark}>ATRIO</Text>
          <Text style={estilos.tituloActualizacion}>Actualiza la app para continuar</Text>
          <Text style={estilos.cuerpoActualizacion}>
            Esta versión ya no es compatible. Instala la última versión para seguir comprando.
          </Text>
          <Pressable
            style={estilos.botonActualizacion}
            onPress={abrirTiendaParaActualizar}
            accessibilityRole="button"
          >
            <Text style={estilos.etiquetaBotonActualizacion}>Actualizar ahora</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={estilos.contenedor} pointerEvents="none">
      <StatusBar style="light" />
      <View style={estilos.contenido}>
        <Animated.Text
          style={[estilos.wordmark, { opacity: opacidad, transform: [{ scale: escala }] }]}
        >
          ATRIO
        </Animated.Text>

        <Animated.Text style={[estilos.bajada, { opacity: aparicionSecundaria }]}>
          MODA CIRCULAR · PERÚ
        </Animated.Text>

        {fase === 'reintentando' ? (
          <Animated.Text style={[estilos.reintento, { opacity: aparicionSecundaria }]}>
            Reintentando conexión…
          </Animated.Text>
        ) : (
          <Animated.View style={[estilos.riel, { opacity: aparicionSecundaria }]}>
            <Animated.View
              style={[estilos.relleno, { transform: [{ translateX: desplazamientoRelleno }] }]}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORS.tinta,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 56,
  },
  contenido: {
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: 'Archivo_900Black',
    fontSize: 54,
    lineHeight: 58,
    letterSpacing: -1.6,
    color: COLORS.papel,
  },
  bajada: {
    marginTop: 26,
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 9.5,
    letterSpacing: 3.23,
    color: COLORS.papel45,
  },
  riel: {
    marginTop: 26,
    width: ANCHO_BARRA,
    height: 2,
    backgroundColor: COLORS.papel20,
    overflow: 'hidden',
  },
  relleno: {
    width: ANCHO_RELLENO_BARRA,
    height: 2,
    backgroundColor: COLORS.arcilla,
  },
  reintento: {
    marginTop: 26,
    fontFamily: 'Archivo_400Regular',
    fontSize: 12,
    color: COLORS.papel60,
  },
  tituloActualizacion: {
    marginTop: 26,
    fontFamily: 'Archivo_900Black',
    fontSize: 15,
    letterSpacing: -0.3,
    color: COLORS.papel,
    textAlign: 'center',
  },
  cuerpoActualizacion: {
    marginTop: 12,
    maxWidth: 260,
    fontFamily: 'Archivo_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.papel60,
    textAlign: 'center',
  },
  botonActualizacion: {
    marginTop: 28,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.arcilla,
  },
  etiquetaBotonActualizacion: {
    fontFamily: 'Archivo_400Regular',
    fontSize: 13,
    color: COLORS.papel,
  },
});
