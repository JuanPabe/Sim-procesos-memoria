import { describe, it, expect } from "vitest";
import { Proceso } from "../src/modelos/Proceso.js";
import { Simulador } from "../src/nucleo/Simulador.js";

describe("Simulador", () => {
  it("agrega un proceso y lo admite en memoria", () => {
    const simulador = new Simulador(1024, 2);
    const proceso = new Proceso(1, 128, 4);

    simulador.agregarProceso(proceso);
    const estado = simulador.obtenerEstado();

    expect(estado.procesoEnCpu).toBeUndefined();
    expect(estado.listos).toHaveLength(1);
    expect(proceso.estado).toBe("LISTO");
  });

  it("ejecuta un tick y avanza el tiempo del simulador", () => {
    const simulador = new Simulador(1024, 2);
    const proceso = new Proceso(1, 128, 4);

    simulador.agregarProceso(proceso);
    simulador.tick();

    const estado = simulador.obtenerEstado();
    expect(estado.tick).toBe(1);
    expect(estado.procesoEnCpu).toBeDefined();
  });

  it("cancela un proceso y admite uno que esperaba memoria", () => {
    const simulador = new Simulador(200, 2);
    const p1 = new Proceso(1, 100, 5);
    const p2 = new Proceso(2, 120, 5);

    simulador.agregarProceso(p1);
    simulador.agregarProceso(p2);

    expect(simulador.obtenerEstado().esperandoMemoria).toHaveLength(1);

    simulador.liberarProceso(1);

    const estado = simulador.obtenerEstado();
    expect(estado.esperandoMemoria).toHaveLength(0);
    expect(estado.cancelados.some((proceso) => proceso.pid === 1)).toBe(true);
    expect(estado.listos.some((proceso) => proceso.pid === 2)).toBe(true);
  });

  it("cancela un proceso que esta ejecutandose y lo retira de la CPU", () => {
    const simulador = new Simulador(100, 2);
    const proceso = new Proceso(1, 100, 5);

    simulador.agregarProceso(proceso);
    simulador.tick();
    simulador.liberarProceso(1);

    const estado = simulador.obtenerEstado();
    expect(estado.procesoEnCpu).toBeUndefined();
    expect(estado.cancelados[0]?.estado).toBe("CANCELADO");
    expect(estado.mapaMemoria.every((bloque) => bloque.estaLibre)).toBe(true);
    expect(() => simulador.tick()).not.toThrow();
  });

  it("cancela un proceso que todavia esperaba memoria", () => {
    const simulador = new Simulador(100, 2);
    simulador.agregarProceso(new Proceso(1, 100, 5));
    simulador.agregarProceso(new Proceso(2, 50, 5));

    simulador.liberarProceso(2);

    const estado = simulador.obtenerEstado();
    expect(estado.esperandoMemoria).toHaveLength(0);
    expect(estado.cancelados.some((proceso) => proceso.pid === 2)).toBe(true);
    expect(estado.mapaMemoria.find((bloque) => !bloque.estaLibre)?.pidAsignado).toBe(1);
  });

  it("admite los procesos que esperan respetando su orden de llegada", () => {
    const simulador = new Simulador(100, 2);
    simulador.agregarProceso(new Proceso(1, 100, 5));
    simulador.agregarProceso(new Proceso(2, 60, 5));
    simulador.agregarProceso(new Proceso(3, 30, 5));

    simulador.liberarProceso(1);
    simulador.tick();

    const estado = simulador.obtenerEstado();
    expect(estado.procesoEnCpu?.pid).toBe(2);
    expect(estado.listos.map((proceso) => proceso.pid)).toEqual([3]);
  });

  it("mantiene FIFO si el primer proceso en espera no cabe en memoria", () => {
    const simulador = new Simulador(150, 2);
    simulador.agregarProceso(new Proceso(1, 100, 5));
    simulador.agregarProceso(new Proceso(2, 50, 5));
    simulador.agregarProceso(new Proceso(3, 60, 5));
    simulador.agregarProceso(new Proceso(4, 30, 5));

    simulador.liberarProceso(2);

    const estado = simulador.obtenerEstado();
    expect(estado.esperandoMemoria.map((proceso) => proceso.pid)).toEqual([3, 4]);
    expect(estado.listos).toHaveLength(1);
  });

  it("cancela un proceso bloqueado y lo retira de la cola de E/S", () => {
    const simulador = new Simulador(100, 2);
    const proceso = new Proceso(1, 100, 5, { despuesDeTicksCpu: 1, duracion: 3 });

    simulador.agregarProceso(proceso);
    simulador.tick();
    simulador.tick();
    expect(simulador.obtenerEstado().bloqueados).toHaveLength(1);

    simulador.liberarProceso(1);

    const estado = simulador.obtenerEstado();
    expect(estado.bloqueados).toHaveLength(0);
    expect(estado.cancelados.some((p) => p.pid === 1)).toBe(true);
    expect(estado.mapaMemoria.every((bloque) => bloque.estaLibre)).toBe(true);
  });

  it("rechaza agregar un proceso que ya no esta NUEVO sin reservar memoria", () => {
    const simulador = new Simulador(100, 2);
    const proceso = new Proceso(1, 50, 5);
    proceso.cancelar();

    expect(() => simulador.agregarProceso(proceso)).toThrow(/debe ser NUEVO/);
    expect(simulador.obtenerEstado().mapaMemoria).toEqual([
      { inicio: 0, tamanio: 100, estaLibre: true, pidAsignado: undefined },
    ]);
  });

  it("bloquea procesos al cumplir el evento de E/S", () => {
    const simulador = new Simulador(1024, 2);
    const bloqueado = new Proceso(1, 128, 3, { despuesDeTicksCpu: 1, duracion: 1 });

    simulador.agregarProceso(bloqueado);
    simulador.tick();
    simulador.tick();

    const estado = simulador.obtenerEstado();
    expect(estado.listos.some((proceso) => proceso.pid === 1)).toBe(true);
  });

  it("finaliza un proceso cuando consume toda su CPU", () => {
    const simulador = new Simulador(1024, 2);
    const terminado = new Proceso(2, 128, 1);

    simulador.agregarProceso(terminado);
    simulador.tick();
    simulador.tick();

    const estado = simulador.obtenerEstado();
    expect(estado.terminados.some((proceso) => proceso.pid === 2)).toBe(true);
  });

  it("libera memoria cuando un proceso termina", () => {
    const simulador = new Simulador(200, 2);
    const proceso = new Proceso(1, 80, 1);

    simulador.agregarProceso(proceso);
    simulador.tick();
    simulador.tick();

    const estado = simulador.obtenerEstado();
    expect(estado.terminados.some((p) => p.pid === 1)).toBe(true);
    expect(estado.mapaMemoria.every((bloque) => bloque.estaLibre)).toBe(true);
  });

  it("reporta métricas del sistema en cada tick", () => {
    const simulador = new Simulador(100, 2);
    const p1 = new Proceso(1, 50, 3);
    const p2 = new Proceso(2, 50, 3);

    simulador.agregarProceso(p1);
    simulador.agregarProceso(p2);
    simulador.tick();

    const metricas = simulador.obtenerMetricas();
    expect(metricas.tick).toBe(1);
    expect(metricas.ocupacionMemoria).toBe(100);
    expect(metricas.memoriaLibreTotal).toBe(0);
    expect(metricas.mayorBloqueLibre).toBe(0);
    expect(metricas.fragmentacionExterna).toBe(0);
    expect(metricas.cambiosDeContexto).toBeGreaterThanOrEqual(1);
    expect(metricas.utilizacionCpu).toBe(100);
  });
});
