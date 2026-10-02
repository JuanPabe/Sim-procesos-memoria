import { describe, it, expect } from "vitest";
import { PrimerAjuste } from "../src/memoria/PoliticaAsignacion.js";
import type { InfoBloque } from "../src/tipos.js";

describe("PrimerAjuste", () => {
  const politica = new PrimerAjuste();

  it("selecciona el primer bloque libre con tamaño suficiente", () => {
    const bloques: InfoBloque[] = [
      { inicio: 0, tamanio: 100, estaLibre: true, pidAsignado: undefined },
      { inicio: 100, tamanio: 300, estaLibre: true, pidAsignado: undefined },
      { inicio: 400, tamanio: 200, estaLibre: true, pidAsignado: undefined },
    ];
    const res = politica.seleccionarBloque(bloques, 150);
    expect(res).toEqual({ inicio: 100, tamanio: 300, estaLibre: true, pidAsignado: undefined });
  });

  it("devuelve undefined si ningún bloque alcanza", () => {
    const bloques: InfoBloque[] = [
      { inicio: 0, tamanio: 100, estaLibre: true, pidAsignado: undefined },
      { inicio: 100, tamanio: 200, estaLibre: true, pidAsignado: undefined },
    ];
    const res = politica.seleccionarBloque(bloques, 250);
    expect(res).toBeUndefined();
  });
});
