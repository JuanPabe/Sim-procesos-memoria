import { describe, it, expect } from "vitest";
import { Proceso } from "../src/modelos/Proceso.js";

describe("Proceso - constructor y getters", () => {
  it("crea un proceso válido", () => {
    const p = new Proceso(1, 256, 4);
    expect(p.pid).toBe(1);
    expect(p.memoriaRequerida).toBe(256);
    expect(p.cpuTotal).toBe(4);
    expect(p.cpuRestante).toBe(4);
    expect(p.estado).toBe("NUEVO");
    expect(p.quantumConsumido).toBe(0);
    expect(p.ticksESRestantes).toBe(0);
    expect(p.ticksCpuConsumidos).toBe(0);
    expect(p.eventoES).toBeUndefined();
  });

  it("rechaza pid no positivo o no entero", () => {
    expect(() => new Proceso(0, 256, 4)).toThrow(/PID/);
    expect(() => new Proceso(-1, 256, 4)).toThrow(/PID/);
    expect(() => new Proceso(1.5, 256, 4)).toThrow(/PID/);
  });

  it("rechaza memoriaRequerida no positiva o no entera", () => {
    expect(() => new Proceso(1, 0, 4)).toThrow(/Memoria/);
    expect(() => new Proceso(1, -100, 4)).toThrow(/Memoria/);
    expect(() => new Proceso(1, 128.5, 4)).toThrow(/Memoria/);
  });

  it("rechaza cpuTotal no positivo o no entero", () => {
    expect(() => new Proceso(1, 256, 0)).toThrow(/CPU/);
    expect(() => new Proceso(1, 256, -2)).toThrow(/CPU/);
    expect(() => new Proceso(1, 256, 3.2)).toThrow(/CPU/);
  });

  it("acepta eventoES válido", () => {
    const p = new Proceso(1, 256, 4, { despuesDeTicksCpu: 2, duracion: 3 });
    expect(p.eventoES).toEqual({ despuesDeTicksCpu: 2, duracion: 3 });
  });

  it("rechaza eventoES.despuesDeTicksCpu inválido", () => {
    expect(() => new Proceso(1, 256, 4, { despuesDeTicksCpu: 0, duracion: 3 })).toThrow(/EventoES/);
    expect(() => new Proceso(1, 256, 4, { despuesDeTicksCpu: -1, duracion: 3 })).toThrow(/EventoES/);
  });

  it("rechaza eventoES.duracion inválida", () => {
    expect(() => new Proceso(1, 256, 4, { despuesDeTicksCpu: 2, duracion: 0 })).toThrow(/EventoES/);
  });

  it("rechaza eventoES.despuesDeTicksCpu >= cpuTotal", () => {
    expect(() => new Proceso(1, 256, 4, { despuesDeTicksCpu: 4, duracion: 3 })).toThrow(/EventoES/);
    expect(() => new Proceso(1, 256, 4, { despuesDeTicksCpu: 5, duracion: 3 })).toThrow(/EventoES/);
  });
});

describe("Proceso - transiciones de estado y mutaciones", () => {
  it("NUEVO → ESPERANDO_MEMORIA", () => {
    const p = new Proceso(1, 256, 4);
    p.marcarEsperando();
    expect(p.estado).toBe("ESPERANDO_MEMORIA");
  });

  it("NUEVO → LISTO (admitir)", () => {
    const p = new Proceso(1, 256, 4);
    p.admitir();
    expect(p.estado).toBe("LISTO");
  });

  it("ESPERANDO_MEMORIA → LISTO", () => {
    const p = new Proceso(1, 256, 4);
    p.marcarEsperando();
    p.admitir();
    expect(p.estado).toBe("LISTO");
  });

  it("LISTO → EJECUTANDO (despachar)", () => {
    const p = new Proceso(1, 256, 4);
    p.admitir();
    p.despachar();
    expect(p.estado).toBe("EJECUTANDO");
    expect(p.quantumConsumido).toBe(0);
  });

  it("ejecutarTick incrementa contadores y reduce cpuRestante", () => {
    const p = new Proceso(1, 256, 4);
    p.admitir();
    p.despachar();
    p.ejecutarTick();
    expect(p.quantumConsumido).toBe(1);
    expect(p.cpuRestante).toBe(3);
    expect(p.ticksCpuConsumidos).toBe(1);
  });

  it("EJECUTANDO → LISTO (expulsar)", () => {
    const p = new Proceso(1, 256, 4);
    p.admitir();
    p.despachar();
    p.expulsar();
    expect(p.estado).toBe("LISTO");
  });

  it("EJECUTANDO → TERMINADO", () => {
    const p = new Proceso(1, 256, 1);
    p.admitir();
    p.despachar();
    p.ejecutarTick();
    p.terminar();
    expect(p.estado).toBe("TERMINADO");
  });

  it("EJECUTANDO → BLOQUEADO → LISTO", () => {
    const p = new Proceso(1, 256, 4, { despuesDeTicksCpu: 2, duracion: 3 });
    p.admitir();
    p.despachar();
    p.bloquear();
    expect(p.estado).toBe("BLOQUEADO");
    expect(p.ticksESRestantes).toBe(3);

    p.decrementarES();
    expect(p.ticksESRestantes).toBe(2);
    p.decrementarES();
    p.decrementarES();
    expect(p.ticksESRestantes).toBe(0);

    p.desbloquear();
    expect(p.estado).toBe("LISTO");
    expect(p.ticksESRestantes).toBe(0);
  });

  it("renovarQuantum reinicia quantumConsumido", () => {
    const p = new Proceso(1, 256, 4);
    p.admitir();
    p.despachar();
    p.ejecutarTick();
    p.ejecutarTick();
    expect(p.quantumConsumido).toBe(2);
    p.renovarQuantum();
    expect(p.quantumConsumido).toBe(0);
    expect(p.estado).toBe("EJECUTANDO");
  });

  it("lanza error en transiciones ilegales", () => {
    const p = new Proceso(1, 256, 4);
    expect(() => p.despachar()).toThrow(/Transición ilegal/);
    expect(() => p.ejecutarTick()).toThrow(/no está EJECUTANDO/);
    expect(() => p.renovarQuantum()).toThrow(/no está EJECUTANDO/);
    expect(() => p.decrementarES()).toThrow(/no está BLOQUEADO/);
  });

  it("decrementarES lanza error si ticksESRestantes es 0", () => {
    const p = new Proceso(1, 256, 4, { despuesDeTicksCpu: 1, duracion: 1 });
    p.admitir();
    p.despachar();
    p.bloquear();
    p.decrementarES();
    expect(() => p.decrementarES()).toThrow(/ya es 0/);
  });

  it("bloquear lanza error sin eventoES", () => {
    const p = new Proceso(1, 256, 4);
    p.admitir();
    p.despachar();
    expect(() => p.bloquear()).toThrow(/no tiene evento/);
  });
});

describe("Proceso - obtenerInfo", () => {
  it("retorna una vista de solo lectura inmutable", () => {
    const p = new Proceso(1, 256, 4);
    const info = p.obtenerInfo();
    expect(info).toEqual({
      pid: 1,
      memoriaRequerida: 256,
      cpuTotal: 4,
      cpuRestante: 4,
      estado: "NUEVO",
      quantumConsumido: 0,
      ticksESRestantes: 0,
      ticksCpuConsumidos: 0,
    });
  });
});
