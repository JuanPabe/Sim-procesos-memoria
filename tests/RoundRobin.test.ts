import { describe, it, expect } from "vitest";
import { Proceso } from "../src/modelos/Proceso.js";
import { RoundRobinPlanificador } from "../src/planificador/RoundRobinPlanificador.js";

describe("RoundRobinPlanificador", () => {
  it("devuelve sin_proceso cuando no hay procesos listos", () => {
    const planificador = new RoundRobinPlanificador(2);

    expect(planificador.hayListos()).toBe(false);
    expect(planificador.ejecutarTickCpu()).toBe("sin_proceso");
  });

  it("despacha el primer proceso y lo deja en CPU", () => {
    const planificador = new RoundRobinPlanificador(2);
    const proceso = new Proceso(1, 100, 5);

    planificador.encolar(proceso);

    expect(planificador.hayListos()).toBe(true);
    expect(planificador.procesoEnCpu()).toBeUndefined();

    const resultado = planificador.ejecutarTickCpu();

    expect(resultado).toBe("continua");
    expect(planificador.procesoEnCpu()).toBe(proceso);
    expect(proceso.estado).toBe("EJECUTANDO");
    expect(planificador.obtenerCambiosDeContexto()).toBe(1);
  });

  it("expulsa un proceso cuando se agota el quantum", () => {
    const planificador = new RoundRobinPlanificador(2);
    const p1 = new Proceso(1, 100, 5);
    const p2 = new Proceso(2, 100, 5);

    planificador.encolar(p1);
    planificador.encolar(p2);

    planificador.ejecutarTickCpu();
    planificador.ejecutarTickCpu();
    const resultado = planificador.ejecutarTickCpu();

    expect(resultado).toBe("expulsado");
    expect(planificador.procesoEnCpu()).toBeUndefined();
    expect(planificador.obtenerColaListos()).toHaveLength(2);
    expect(planificador.obtenerColaListos()[0]).toBe(p2);
  });
});
