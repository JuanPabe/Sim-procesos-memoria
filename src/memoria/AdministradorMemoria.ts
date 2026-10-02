/**
 * AdministradorMemoria.ts
 *
 * Gestiona los bloques de memoria contigua.
 * Delega la seleccion de bloques a la politica inyectada (Strategy).
 */

import { BloqueMemoria } from "./BloqueMemoria.js";
import type { PoliticaAsignacion } from "./PoliticaAsignacion.js";
import type { InfoBloque } from "../tipos.js";

export class AdministradorMemoria {
  private readonly _memoriaTotal: number;
  private readonly _politica: PoliticaAsignacion;
  private _bloques: BloqueMemoria[];

  constructor(memoriaTotal: number, politica: PoliticaAsignacion) {
    if (!Number.isInteger(memoriaTotal) || memoriaTotal <= 0) {
      throw new Error(
        `memoriaTotal invalida: ${String(memoriaTotal)}. Debe ser un entero positivo.`,
      );
    }
    this._memoriaTotal = memoriaTotal;
    this._politica = politica;
    this._bloques = [new BloqueMemoria(0, memoriaTotal)];
  }

  asignar(pid: number, tamanio: number): boolean {
    const bloquesLibresInfo = this.obtenerBloquesLibresComoInfo();
    const seleccionado = this._politica.seleccionarBloque(bloquesLibresInfo, tamanio);
    if (seleccionado === undefined) return false;

    const indice = this._bloques.findIndex(
      (b) => b.inicio === seleccionado.inicio && b.estaLibre,
    );
    if (indice === -1) return false;

    const bloque = this._bloques[indice];
    if (bloque === undefined) return false;

    if (bloque.tamanio > tamanio) {
      const bloqueRestante = new BloqueMemoria(
        bloque.inicio + tamanio,
        bloque.tamanio - tamanio,
      );
      this._bloques.splice(indice + 1, 0, bloqueRestante);
    }

    bloque.tamanio = tamanio;
    bloque.estaLibre = false;
    bloque.pidAsignado = pid;
    return true;
  }

  liberar(pid: number): void {
    const indice = this._bloques.findIndex((b) => b.pidAsignado === pid);
    if (indice === -1) {
      throw new Error(`No se encontró bloque asignado al PID ${String(pid)}.`);
    }

    const bloque = this._bloques[indice];
    if (bloque === undefined) {
      throw new Error(`Indice invalido al liberar PID ${String(pid)}.`);
    }
    bloque.estaLibre = true;
    bloque.pidAsignado = undefined;

    // Coalescencia a la derecha
    const siguiente = this._bloques[indice + 1];
    if (siguiente !== undefined && siguiente.estaLibre) {
      bloque.tamanio += siguiente.tamanio;
      this._bloques.splice(indice + 1, 1);
    }

    // Coalescencia a la izquierda
    const indiceFinal = this._bloques.findIndex((b) => b.inicio === bloque.inicio);
    if (indiceFinal > 0) {
      const anterior = this._bloques[indiceFinal - 1];
      if (anterior !== undefined && anterior.estaLibre) {
        anterior.tamanio += bloque.tamanio;
        this._bloques.splice(indiceFinal, 1);
      }
    }
  }

  obtenerMapa(): ReadonlyArray<InfoBloque> {
    return this._bloques.map((b) => ({
      inicio: b.inicio,
      tamanio: b.tamanio,
      estaLibre: b.estaLibre,
      pidAsignado: b.pidAsignado,
    }));
  }

  memoriaLibreTotal(): number {
    return this._bloques
      .filter((b) => b.estaLibre)
      .reduce((acc, b) => acc + b.tamanio, 0);
  }

  mayorBloqueLibre(): number {
    const libres = this._bloques.filter((b) => b.estaLibre);
    if (libres.length === 0) return 0;
    return Math.max(...libres.map((b) => b.tamanio));
  }

  memoriaOcupada(): number {
    return this._memoriaTotal - this.memoriaLibreTotal();
  }

  private obtenerBloquesLibresComoInfo(): ReadonlyArray<InfoBloque> {
    return this._bloques
      .filter((b) => b.estaLibre)
      .map((b) => ({
        inicio: b.inicio,
        tamanio: b.tamanio,
        estaLibre: b.estaLibre,
        pidAsignado: b.pidAsignado,
      }));
  }
}
