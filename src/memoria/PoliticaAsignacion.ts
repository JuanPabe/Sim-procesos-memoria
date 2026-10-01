/**
 * PoliticaAsignacion.ts
 *
 * Interfaz `PoliticaAsignacion` e implementaciones:
 * - PrimerAjuste: primer bloque con tamaño suficiente.
 * - MejorAjuste: bloque con menor tamaño suficiente (desempate: menor dirección).
 * - PeorAjuste: bloque con mayor tamaño suficiente (desempate: menor dirección).
 */

import type { InfoBloque } from "../tipos.js";

export interface PoliticaAsignacion {
  seleccionarBloque(
    bloquesLibres: ReadonlyArray<InfoBloque>,
    tamanio: number,
  ): InfoBloque | undefined;
}

export class PrimerAjuste implements PoliticaAsignacion {
  seleccionarBloque(
    bloquesLibres: ReadonlyArray<InfoBloque>,
    tamanio: number,
  ): InfoBloque | undefined {
    return bloquesLibres.find((b) => b.tamanio >= tamanio);
  }
}

export class MejorAjuste implements PoliticaAsignacion {
  seleccionarBloque(
    bloquesLibres: ReadonlyArray<InfoBloque>,
    tamanio: number,
  ): InfoBloque | undefined {
    const candidatos = bloquesLibres.filter((b) => b.tamanio >= tamanio);
    if (candidatos.length === 0) return undefined;
    return candidatos.reduce((mejor, actual) => {
      if (actual.tamanio < mejor.tamanio) return actual;
      if (actual.tamanio === mejor.tamanio && actual.inicio < mejor.inicio) return actual;
      return mejor;
    });
  }
}

export class PeorAjuste implements PoliticaAsignacion {
  seleccionarBloque(
    bloquesLibres: ReadonlyArray<InfoBloque>,
    tamanio: number,
  ): InfoBloque | undefined {
    const candidatos = bloquesLibres.filter((b) => b.tamanio >= tamanio);
    if (candidatos.length === 0) return undefined;
    return candidatos.reduce((peor, actual) => {
      if (actual.tamanio > peor.tamanio) return actual;
      if (actual.tamanio === peor.tamanio && actual.inicio < peor.inicio) return actual;
      return peor;
    });
  }
}
