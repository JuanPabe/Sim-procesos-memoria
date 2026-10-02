/**
 * Planificador.ts
 *
 * Interfaz del planificador de CPU.
 */

import type { Proceso } from "../modelos/Proceso.js";

export type ResultadoTick =
  | "terminado"
  | "bloqueado"
  | "expulsado"
  | "continua"
  | "sin_proceso";

export interface Planificador {
  encolar(proceso: Proceso): void;
  ejecutarTickCpu(): ResultadoTick;
  procesoEnCpu(): Proceso | undefined;
  hayListos(): boolean;
  obtenerCambiosDeContexto(): number;
  obtenerColaListos(): ReadonlyArray<Proceso>;
}
