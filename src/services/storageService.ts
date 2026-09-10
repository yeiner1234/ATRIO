import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CLAVE_TOKEN_SESION = 'atrio.auth.token';

export const CLAVES_ALMACENAMIENTO = {
  carrito: 'atrio.carrito',
  favoritos: 'atrio.favoritos',
  intentosInicioSesion: 'atrio.login.attempts',
  bloqueoInicioSesion: 'atrio.login.lockedUntil',
} as const;

export const servicioAlmacenamiento = {
  async obtenerTokenSesion(): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return await AsyncStorage.getItem(CLAVE_TOKEN_SESION);
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(CLAVE_TOKEN_SESION);
    } catch {
      return null;
    }
  },

  async guardarTokenSesion(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(CLAVE_TOKEN_SESION, token);
      return;
    }
    try {
      await SecureStore.setItemAsync(CLAVE_TOKEN_SESION, token);
    } catch {
      await AsyncStorage.setItem(CLAVE_TOKEN_SESION, token);
    }
  },

  async eliminarTokenSesion(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(CLAVE_TOKEN_SESION);
      } else {
        await SecureStore.deleteItemAsync(CLAVE_TOKEN_SESION);
      }
    } catch {
    }
  },

  async obtenerDato<T>(clave: string): Promise<T | null> {
    try {
      const bruto = await AsyncStorage.getItem(clave);
      return bruto ? (JSON.parse(bruto) as T) : null;
    } catch {
      return null;
    }
  },

  async guardarDato<T>(clave: string, valor: T): Promise<void> {
    try {
      await AsyncStorage.setItem(clave, JSON.stringify(valor));
    } catch {
    }
  },

  async eliminarDato(clave: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(clave);
    } catch {
    }
  },
};
