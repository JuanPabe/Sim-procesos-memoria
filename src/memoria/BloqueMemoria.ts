/**
 * BloqueMemoria.ts
 *
 * Representacion interna mutable de un bloque de memoria contiguo.
 * Solo debe usarse dentro del paquete `memoria`.
 */

export class BloqueMemoria {
  inicio: number;
  tamanio: number;
  estaLibre: boolean;
  pidAsignado: number | undefined;

  constructor(inicio: number, tamanio: number) {
    this.inicio = inicio;
    this.tamanio = tamanio;
    this.estaLibre = true;
    this.pidAsignado = undefined;
  }
}
