import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
// @ts-ignore: getReactNativePersistence existe no bundle React Native, mas nem sempre nos tipos
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Chaves de app web do Firebase identificam o projeto e não são segredo.
const firebaseConfig = {
  apiKey: 'AIzaSyAlD3XHqlsmuVW_oRHY6ou1pH6dl2KPv8U',
  authDomain: 'mobifix-59380.firebaseapp.com',
  projectId: 'mobifix-59380',
  storageBucket: 'mobifix-59380.firebasestorage.app',
  messagingSenderId: '189020392437',
  appId: '1:189020392437:web:28836d2fee731d7c8e2ebc',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function criarAuth() {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(app); // já inicializado (fast refresh)
  }
}

export const auth = criarAuth();
export const db = getFirestore(app);
