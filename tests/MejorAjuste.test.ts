import { describe, it, expect } from "vitest";
import { MejorAjuste } from "../src/memoria/PoliticaAsignacion.js";
import type { InfoBloque } from "../src/tipos.js";

describe("MejorAjuste", () => {
  const politica = new MejorAjuste();

  it("selecciona el bloque libre más pequeño que sea suficiente", () => {
    const bloques: InfoBloque[] = [
      { inicio: 0, tamanio: 300, estaLibre: true, pidAsignado: undefined },
      { inicio: 300, tamanio: 150, estaLibre: true, pidAsignado: undefined },
      { inicio: 450, tamanio: 200, estaLibre: true, pidAsignado: undefined },
    ];
    const res = politica.seleccionarBloque(bloques, 120);
    expect(res).toEqual({ inicio: 300, tamanio: 150, estaLibre: true, pidAsignado: undefined });
  });

  it("desempata por menor dirección si hay igual tamaño", () => {
    const bloques: InfoBloque[] = [
      { inicio: 0, tamanio: 200, estaLibre: true, pidAsignado: undefined },
      { inicio: 200, tamanio: 150, estaLibre: true, pidAsignado: undefined },
      { inicio: 350, tamanio: 150, estaLibre: true, pidAsignado: undefined },
    ];
    const res = politica.seleccionarBloque(bloques, 100);
    expect(res?.inicio).toBe(200);
  });

  it("devuelve undefined si no hay bloque suficiente", () => {
    const bloques: InfoBloque[] = [
      { inicio: 0, tamanio: 50, estaLibre: true, pidAsignado: undefined },
    ];
    const res = politica.seleccionarBloque(bloques, 100);
    expect(res).toBeUndefined();
  });
});
