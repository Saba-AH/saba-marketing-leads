import React from 'react';

/** Cuánto puede faltar para el final y seguir contando como "abajo". */
const UMBRAL_PX = 80;

/**
 * El hilo sigue a los mensajes nuevos solo si ya estabas abajo. Si subiste a
 * leer, no te arrastra: cuenta los nuevos para mostrarlos en el botón de bajar.
 */
export function useScrollAlFinal(cantidadMensajes: number) {
  const contenedorRef = React.useRef<HTMLDivElement>(null);
  const alFinalRef = React.useRef(true);
  const cantidadPreviaRef = React.useRef(0);
  const [alFinal, setAlFinal] = React.useState(true);
  const [nuevos, setNuevos] = React.useState(0);

  const irAlFinal = React.useCallback((suave = true): void => {
    const contenedor = contenedorRef.current;
    contenedor?.scrollTo?.({
      top: contenedor.scrollHeight,
      behavior: suave ? 'smooth' : 'auto',
    });
    alFinalRef.current = true;
    setAlFinal(true);
    setNuevos(0);
  }, []);

  const onScroll = React.useCallback((): void => {
    const contenedor = contenedorRef.current;
    if (!contenedor) return;
    const distancia =
      contenedor.scrollHeight - contenedor.scrollTop - contenedor.clientHeight;
    const enElFinal = distancia < UMBRAL_PX;
    alFinalRef.current = enElFinal;
    setAlFinal(enElFinal);
    if (enElFinal) setNuevos(0);
  }, []);

  React.useEffect(() => {
    const agregados = cantidadMensajes - cantidadPreviaRef.current;
    const primeraCarga = cantidadPreviaRef.current === 0;
    cantidadPreviaRef.current = cantidadMensajes;
    if (agregados <= 0) return;
    if (primeraCarga) irAlFinal(false);
    else if (alFinalRef.current) irAlFinal();
    else setNuevos((n) => n + agregados);
  }, [cantidadMensajes, irAlFinal]);

  return { contenedorRef, alFinal, nuevos, onScroll, irAlFinal };
}
