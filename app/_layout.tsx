import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { CarritoProvider } from '@/context/CarritoContext';
import { FavoritosProvider } from '@/context/FavoritosContext';
import { useFuentesApp } from '@/hooks/useFuentesApp';

export default function LayoutRaiz() {
  const fuentesListas = useFuentesApp();

  if (!fuentesListas) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <FavoritosProvider>
          <CarritoProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.papel },
              }}
            />
          </CarritoProvider>
        </FavoritosProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
