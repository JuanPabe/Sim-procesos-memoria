import { describe, it, expect } from "vitest";
import { PeorAjuste } from "../src/memoria/PoliticaAsignacion.js";
import type { InfoBloque } from "../src/tipos.js";

describe("PeorAjuste", () => {
  const politica = new PeorAjuste();

  it("selecciona el bloque libre de mayor tamaño disponible", () => {
    const bloques: InfoBloque[] = [
      { inicio: 0, tamanio: 100, estaLibre: true, pidAsignado: undefined },
      { inicio: 100, tamanio: 500, estaLibre: true, pidAsignado: undefined },
      { inicio: 600, tamanio: 300, estaLibre: true, pidAsignado: undefined },
    ];
    const res = politica.seleccionarBloque(bloques, 150);
    expect(res).toEqual({ inicio: 100, tamanio: 500, estaLibre: true, pidAsignado: undefined });
  });

  it("desempata por menor dirección si hay varios con igual mayor tamaño", () => {
    const bloques: InfoBloque[] = [
      { inicio: 0, tamanio: 400, estaLibre: true, pidAsignado: undefined },
      { inicio: 400, tamanio: 500, estaLibre: true, pidAsignado: undefined },
      { inicio: 900, tamanio: 500, estaLibre: true, pidAsignado: undefined },
    ];
    const res = politica.seleccionarBloque(bloques, 100);
    expect(res?.inicio).toBe(400);
  });

  it("devuelve undefined si no hay bloque suficiente", () => {
    const bloques: InfoBloque[] = [
      { inicio: 0, tamanio: 50, estaLibre: true, pidAsignado: undefined },
    ];
    const res = politica.seleccionarBloque(bloques, 100);
    expect(res).toBeUndefined();
  });
});
