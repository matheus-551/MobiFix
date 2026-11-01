import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Perfil } from '../types';

/** Lê o perfil do usuário em users/{uid}. Retorna null se não existir ou se der erro. */
export async function buscarPerfil(uid: string): Promise<Perfil | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as Perfil) : null;
  } catch {
    return null;
  }
}
