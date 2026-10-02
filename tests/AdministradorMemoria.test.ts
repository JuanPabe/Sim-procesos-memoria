import { describe, it, expect } from "vitest";
import { AdministradorMemoria } from "../src/memoria/AdministradorMemoria.js";
import { PrimerAjuste } from "../src/memoria/PoliticaAsignacion.js";

describe("AdministradorMemoria", () => {
  it("inicia con un único bloque libre abarcando toda la memoria", () => {
    const mem = new AdministradorMemoria(1024, new PrimerAjuste());
    expect(mem.memoriaLibreTotal()).toBe(1024);
    expect(mem.mayorBloqueLibre()).toBe(1024);
    expect(mem.memoriaOcupada()).toBe(0);
    const mapa = mem.obtenerMapa();
    expect(mapa).toHaveLength(1);
    expect(mapa[0]).toEqual({
      inicio: 0,
      tamanio: 1024,
      estaLibre: true,
      pidAsignado: undefined,
    });
  });

  it("rechaza memoriaTotal no positiva o no entera", () => {
    expect(() => new AdministradorMemoria(0, new PrimerAjuste())).toThrow(/memoriaTotal/);
    expect(() => new AdministradorMemoria(-500, new PrimerAjuste())).toThrow(/memoriaTotal/);
    expect(() => new AdministradorMemoria(1024.5, new PrimerAjuste())).toThrow(/memoriaTotal/);
  });

  it("asigna memoria y divide el bloque si sobra espacio", () => {
    const mem = new AdministradorMemoria(1024, new PrimerAjuste());
    const ok = mem.asignar(1, 256);
    expect(ok).toBe(true);
    expect(mem.memoriaOcupada()).toBe(256);
    expect(mem.memoriaLibreTotal()).toBe(768);

    const mapa = mem.obtenerMapa();
    expect(mapa).toHaveLength(2);
    expect(mapa[0]).toEqual({ inicio: 0, tamanio: 256, estaLibre: false, pidAsignado: 1 });
    expect(mapa[1]).toEqual({ inicio: 256, tamanio: 768, estaLibre: true, pidAsignado: undefined });
  });

  it("asigna exactamente sin generar bloque residual de tamaño 0", () => {
    const mem = new AdministradorMemoria(256, new PrimerAjuste());
    const ok = mem.asignar(1, 256);
    expect(ok).toBe(true);
    const mapa = mem.obtenerMapa();
    expect(mapa).toHaveLength(1);
    expect(mapa[0]).toEqual({ inicio: 0, tamanio: 256, estaLibre: false, pidAsignado: 1 });
    expect(mem.mayorBloqueLibre()).toBe(0);
    expect(mem.memoriaLibreTotal()).toBe(0);
  });

  it("falla la asignación si ningún bloque alcanza sin alterar los bloques", () => {
    const mem = new AdministradorMemoria(500, new PrimerAjuste());
    mem.asignar(1, 300);
    const ok = mem.asignar(2, 300); // 300 > 200 libre
    expect(ok).toBe(false);
    expect(mem.memoriaLibreTotal()).toBe(200);
  });

  it("coalescencia: fusiona con vecino derecho", () => {
    const mem = new AdministradorMemoria(1000, new PrimerAjuste());
    mem.asignar(1, 200);
    mem.asignar(2, 300);
    // Bloques: [0..200 (PID1)], [200..500 (PID2)], [500..1000 (Libre 500)]
    mem.liberar(2);
    // Debe fusionar PID2 libre (300) con libre derecho (500) -> 800
    const mapa = mem.obtenerMapa();
    expect(mapa).toHaveLength(2);
    expect(mapa[0]).toEqual({ inicio: 0, tamanio: 200, estaLibre: false, pidAsignado: 1 });
    expect(mapa[1]).toEqual({ inicio: 200, tamanio: 800, estaLibre: true, pidAsignado: undefined });
  });

  it("coalescencia: fusiona con vecino izquierdo", () => {
    const mem = new AdministradorMemoria(1000, new PrimerAjuste());
    mem.asignar(1, 200);
    mem.asignar(2, 300);
    mem.asignar(3, 500);
    // Liberar PID1 -> [0..200 Libre], [200..500 PID2], [500..1000 PID3]
    mem.liberar(1);
    // Liberar PID2 -> se fusiona a izquierda con [0..200 Libre] -> [0..500 Libre]
    mem.liberar(2);
    const mapa = mem.obtenerMapa();
    expect(mapa).toHaveLength(2);
    expect(mapa[0]).toEqual({ inicio: 0, tamanio: 500, estaLibre: true, pidAsignado: undefined });
    expect(mapa[1]).toEqual({ inicio: 500, tamanio: 500, estaLibre: false, pidAsignado: 3 });
  });

  it("coalescencia: fusiona con ambos vecinos (izq y der)", () => {
    const mem = new AdministradorMemoria(1000, new PrimerAjuste());
    mem.asignar(1, 200);
    mem.asignar(2, 300);
    mem.asignar(3, 500);
    mem.liberar(1); // [0..200 Libre]
    mem.liberar(3); // [500..1000 Libre]
    // Liberar PID2 -> se fusiona con izq (200) y der (500) -> 1000 total
    mem.liberar(2);
    const mapa = mem.obtenerMapa();
    expect(mapa).toHaveLength(1);
    expect(mapa[0]).toEqual({ inicio: 0, tamanio: 1000, estaLibre: true, pidAsignado: undefined });
    expect(mem.memoriaLibreTotal()).toBe(1000);
  });

  it("lanza error al intentar liberar un PID no asignado", () => {
    const mem = new AdministradorMemoria(1024, new PrimerAjuste());
    expect(() => mem.liberar(99)).toThrow(/No se encontró/);
  });
});
