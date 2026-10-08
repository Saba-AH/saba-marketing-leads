/**
 * El cliente ve "escribiendo…" mientras un agente le responde desde el panel.
 * Meta lo ata a marcar como leído su último mensaje (checks azules): con
 * `false` el panel no le avisa nada a Meta y el cliente no ve ninguna de las dos
 * cosas hasta que llegue la respuesta.
 */
export const MOSTRAR_ESCRIBIENDO_AL_CLIENTE = true;

/** Meta lo muestra hasta 25 s: avisar más seguido es gastar llamadas. */
export const INTERVALO_AVISO_ESCRIBIENDO_MS = 20_000;
