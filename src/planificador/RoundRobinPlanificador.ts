import type { Proceso } from "../modelos/Proceso.js";
import type { Planificador, ResultadoTick } from "./Planificador.js";

export class RoundRobinPlanificador implements Planificador {
  private readonly _quantum: number;
  private readonly _colaListos: Proceso[] = [];
  private _procesoEnCpu: Proceso | undefined;
  private _cambiosDeContexto: number;

  constructor(quantum: number) {
    if (!Number.isInteger(quantum) || quantum <= 0) {
      throw new Error(`Quantum invalido: ${String(quantum)}. Debe ser un entero positivo.`);
    }
    this._quantum = quantum;
    this._cambiosDeContexto = 0;
  }

  encolar(proceso: Proceso): void {
    if (proceso.estado === "NUEVO" || proceso.estado === "ESPERANDO_MEMORIA") {
      proceso.admitir();
    }
    this._colaListos.push(proceso);
  }

  ejecutarTickCpu(): ResultadoTick {
    if (this._procesoEnCpu === undefined) {
      if (this._colaListos.length === 0) {
        return "sin_proceso";
      }

      const siguiente = this._colaListos.shift();
      if (siguiente === undefined) {
        return "sin_proceso";
      }

      this._procesoEnCpu = siguiente;
      this._procesoEnCpu.despachar();
      this._cambiosDeContexto += 1;
      return "continua";
    }

    const procesoActual = this._procesoEnCpu;
    procesoActual.ejecutarTick();

    if (procesoActual.eventoES !== undefined) {
      const debeBloquearse = procesoActual.ticksCpuConsumidos >= procesoActual.eventoES.despuesDeTicksCpu;
      if (debeBloquearse) {
        procesoActual.bloquear();
        this._procesoEnCpu = undefined;
        return "bloqueado";
      }
    }

    if (procesoActual.cpuRestante <= 0) {
      procesoActual.terminar();
      this._procesoEnCpu = undefined;
      return "terminado";
    }

    if (procesoActual.quantumConsumido >= this._quantum) {
      procesoActual.renovarQuantum();
      procesoActual.expulsar();
      this._procesoEnCpu = undefined;
      this._colaListos.push(procesoActual);
      return "expulsado";
    }

    return "continua";
  }

  procesoEnCpu(): Proceso | undefined {
    return this._procesoEnCpu;
  }

  hayListos(): boolean {
    return this._colaListos.length > 0 || this._procesoEnCpu !== undefined;
  }

  obtenerCambiosDeContexto(): number {
    return this._cambiosDeContexto;
  }

  obtenerColaListos(): ReadonlyArray<Proceso> {
    return this._colaListos;
  }
}
