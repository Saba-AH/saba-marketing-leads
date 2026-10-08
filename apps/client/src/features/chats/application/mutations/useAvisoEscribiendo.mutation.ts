import { useMutation } from '@tanstack/react-query';
import React from 'react';
import {
  INTERVALO_AVISO_ESCRIBIENDO_MS,
  MOSTRAR_ESCRIBIENDO_AL_CLIENTE,
} from '../../domain/chatsConfig';
import { ChatsService } from '../../infrastructure';

/**
 * Devuelve `avisar()` para llamar en cada tecla: le avisa a Meta como mucho una
 * vez cada 20 s por conversación. Si falla no se muestra nada: es cortesía.
 */
export function useAvisoEscribiendo(conversationId: string): () => void {
  const ultimoAvisoRef = React.useRef(0);
  const { mutate } = useMutation({
    mutationFn: () => ChatsService.indicarEscribiendo(conversationId),
  });

  return React.useCallback(() => {
    if (!MOSTRAR_ESCRIBIENDO_AL_CLIENTE) return;
    const ahora = Date.now();
    if (ahora - ultimoAvisoRef.current < INTERVALO_AVISO_ESCRIBIENDO_MS) return;
    ultimoAvisoRef.current = ahora;
    mutate();
  }, [mutate]);
}
