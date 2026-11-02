import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Perfil } from '../types';

/** Perfil público do prestador (guardado em prestadores/{uid}). Não contém dados de contato. */
export type Prestador = {
  id: string;
  nomeExibicao: string;
  cidade: string;
  uf: string;
  tiposVeiculo: string[];
  especialidades: string[];
  notaMedia: number;
  totalAvaliacoes: number;
};

/**
 * Cria o perfil público do prestador na primeira vez que ele entra com a conta verificada.
 * Assim, só profissionais com e-mail confirmado aparecem na busca.
 */
export async function garantirPerfilPublico(uid: string, perfil: Perfil): Promise<void> {
  if (perfil.papel !== 'PRESTADOR') return;
  try {
    const ref = doc(db, 'prestadores', uid);
    if ((await getDoc(ref)).exists()) return;
    await setDoc(ref, {
      nomeExibicao: perfil.nomeExibicao ?? '',
      cidade: perfil.cidade ?? '',
      uf: perfil.uf,
      tiposVeiculo: perfil.tiposVeiculo ?? [],
      especialidades: perfil.especialidades ?? [],
      notaMedia: 0,
      totalAvaliacoes: 0,
      criadoEm: serverTimestamp(),
    });
  } catch {
    // Tenta de novo no próximo acesso.
  }
}

/** Lê todos os prestadores. Os filtros são aplicados na tela (suficiente para o volume do projeto). */
export async function buscarPrestadores(): Promise<Prestador[]> {
  const snap = await getDocs(collection(db, 'prestadores'));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Prestador, 'id'>) }));
}
