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

  it("libera memoria y admite un proceso que estaba esperando", () => {
    const simulador = new Simulador(200, 2);
    const p1 = new Proceso(1, 100, 5);
    const p2 = new Proceso(2, 120, 5);

    simulador.agregarProceso(p1);
    simulador.agregarProceso(p2);

    expect(simulador.obtenerEstado().esperandoMemoria).toHaveLength(1);

    simulador.liberarProceso(1);
    simulador.tick();

    const estado = simulador.obtenerEstado();
    expect(estado.esperandoMemoria).toHaveLength(0);
    expect(estado.listos.some((proceso) => proceso.pid === 2)).toBe(true);
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
