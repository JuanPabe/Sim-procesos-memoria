/**
 * Proceso.ts
 *
 * Entidad que representa un proceso del sistema.
 * Encapsula el estado y hace cumplir las transiciones legales.
 */

import type { EstadoProceso, EventoES, InfoProceso } from "../tipos.js";

const TRANSICIONES_LEGALES: ReadonlyMap<EstadoProceso, ReadonlySet<EstadoProceso>> = new Map([
  ["NUEVO", new Set<EstadoProceso>(["ESPERANDO_MEMORIA", "LISTO"])],
  ["ESPERANDO_MEMORIA", new Set<EstadoProceso>(["LISTO"])],
  ["LISTO", new Set<EstadoProceso>(["EJECUTANDO"])],
  ["EJECUTANDO", new Set<EstadoProceso>(["LISTO", "BLOQUEADO", "TERMINADO"])],
  ["BLOQUEADO", new Set<EstadoProceso>(["LISTO"])],
  ["TERMINADO", new Set<EstadoProceso>()],
]);

export class Proceso {
  private readonly _pid: number;
  private readonly _memoriaRequerida: number;
  private readonly _cpuTotal: number;
  private readonly _eventoES: EventoES | undefined;

  private _cpuRestante: number;
  private _estado: EstadoProceso;
  private _quantumConsumido: number;
  private _ticksESRestantes: number;
  private _ticksCpuConsumidos: number;

  constructor(
    pid: number,
    memoriaRequerida: number,
    cpuTotal: number,
    eventoES?: EventoES,
  ) {
    if (!Number.isInteger(pid) || pid <= 0) {
      throw new Error(`PID inválido: ${String(pid)}. Debe ser un entero positivo.`);
    }
    if (!Number.isInteger(memoriaRequerida) || memoriaRequerida <= 0) {
      throw new Error(
        `Memoria requerida inválida: ${String(memoriaRequerida)}. Debe ser un entero positivo.`,
      );
    }
    if (!Number.isInteger(cpuTotal) || cpuTotal <= 0) {
      throw new Error(
        `CPU total inválida: ${String(cpuTotal)}. Debe ser un entero positivo.`,
      );
    }
    if (eventoES !== undefined) {
      if (!Number.isInteger(eventoES.despuesDeTicksCpu) || eventoES.despuesDeTicksCpu <= 0) {
        throw new Error(
          `EventoES.despuesDeTicksCpu inválido: ${String(eventoES.despuesDeTicksCpu)}. Debe ser un entero positivo.`,
        );
      }
      if (!Number.isInteger(eventoES.duracion) || eventoES.duracion <= 0) {
        throw new Error(
          `EventoES.duracion inválida: ${String(eventoES.duracion)}. Debe ser un entero positivo.`,
        );
      }
      if (eventoES.despuesDeTicksCpu >= cpuTotal) {
        throw new Error(
          `EventoES.despuesDeTicksCpu (${String(eventoES.despuesDeTicksCpu)}) debe ser menor que cpuTotal (${String(cpuTotal)}).`,
        );
      }
    }

    this._pid = pid;
    this._memoriaRequerida = memoriaRequerida;
    this._cpuTotal = cpuTotal;
    this._eventoES = eventoES;
    this._cpuRestante = cpuTotal;
    this._estado = "NUEVO";
    this._quantumConsumido = 0;
    this._ticksESRestantes = 0;
    this._ticksCpuConsumidos = 0;
  }

  get pid(): number { return this._pid; }
  get memoriaRequerida(): number { return this._memoriaRequerida; }
  get cpuTotal(): number { return this._cpuTotal; }
  get cpuRestante(): number { return this._cpuRestante; }
  get estado(): EstadoProceso { return this._estado; }
  get quantumConsumido(): number { return this._quantumConsumido; }
  get ticksESRestantes(): number { return this._ticksESRestantes; }
  get ticksCpuConsumidos(): number { return this._ticksCpuConsumidos; }
  get eventoES(): EventoES | undefined { return this._eventoES; }

  marcarEsperando(): void {
    this.transicionar("ESPERANDO_MEMORIA");
  }

  admitir(): void {
    this.transicionar("LISTO");
  }

  despachar(): void {
    this.transicionar("EJECUTANDO");
    this._quantumConsumido = 0;
  }

  ejecutarTick(): void {
    if (this._estado !== "EJECUTANDO") {
      throw new Error(`No se puede ejecutar tick: el proceso ${String(this._pid)} no está EJECUTANDO (estado actual: ${this._estado}).`);
    }
    this._quantumConsumido += 1;
    this._cpuRestante -= 1;
    this._ticksCpuConsumidos += 1;
  }

  bloquear(): void {
    if (this._eventoES === undefined) {
      throw new Error(`El proceso ${String(this._pid)} no tiene evento de E/S para bloquearse.`);
    }
    this.transicionar("BLOQUEADO");
    this._ticksESRestantes = this._eventoES.duracion;
  }

  decrementarES(): void {
    if (this._estado !== "BLOQUEADO") {
      throw new Error(`No se puede decrementar E/S: el proceso ${String(this._pid)} no está BLOQUEADO.`);
    }
    if (this._ticksESRestantes <= 0) {
      throw new Error(`ticksESRestantes ya es 0 para el proceso ${String(this._pid)}.`);
    }
    this._ticksESRestantes -= 1;
  }

  desbloquear(): void {
    this.transicionar("LISTO");
    this._ticksESRestantes = 0;
  }

  expulsar(): void {
    this.transicionar("LISTO");
  }

  renovarQuantum(): void {
    if (this._estado !== "EJECUTANDO") {
      throw new Error(`No se puede renovar quantum: el proceso ${String(this._pid)} no está EJECUTANDO.`);
    }
    this._quantumConsumido = 0;
  }

  terminar(): void {
    this.transicionar("TERMINADO");
  }

  obtenerInfo(): InfoProceso {
    return {
      pid: this._pid,
      memoriaRequerida: this._memoriaRequerida,
      cpuTotal: this._cpuTotal,
      cpuRestante: this._cpuRestante,
      estado: this._estado,
      quantumConsumido: this._quantumConsumido,
      ticksESRestantes: this._ticksESRestantes,
      ticksCpuConsumidos: this._ticksCpuConsumidos,
    };
  }

  private transicionar(nuevoEstado: EstadoProceso): void {
    const permitidos = TRANSICIONES_LEGALES.get(this._estado);
    if (permitidos === undefined || !permitidos.has(nuevoEstado)) {
      throw new Error(
        `Transición ilegal: ${this._estado} → ${nuevoEstado} para el proceso ${String(this._pid)}.`,
      );
    }
    this._estado = nuevoEstado;
  }
}
