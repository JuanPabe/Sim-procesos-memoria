/**
 * tipos.ts
 *
 * Interfaces y tipos puros del dominio de simulación.
 */

export type EstadoProceso =
  | "NUEVO"
  | "ESPERANDO_MEMORIA"
  | "LISTO"
  | "EJECUTANDO"
  | "BLOQUEADO"
  | "TERMINADO";

export interface EventoES {
  readonly despuesDeTicksCpu: number;
  readonly duracion: number;
}

export interface InfoBloque {
  readonly inicio: number;
  readonly tamanio: number;
  readonly estaLibre: boolean;
  readonly pidAsignado: number | undefined;
}

export interface InfoProceso {
  readonly pid: number;
  readonly memoriaRequerida: number;
  readonly cpuTotal: number;
  readonly cpuRestante: number;
  readonly estado: EstadoProceso;
  readonly quantumConsumido: number;
  readonly ticksESRestantes: number;
  readonly ticksCpuConsumidos: number;
}

export interface InfoMetricas {
  readonly tick: number;
  readonly ocupacionMemoria: number;
  readonly utilizacionCpu: number;
  readonly cambiosDeContexto: number;
  readonly memoriaLibreTotal: number;
  readonly mayorBloqueLibre: number;
  readonly fragmentacionExterna: number;
}

export interface EstadoSimulador {
  readonly tick: number;
  readonly procesoEnCpu: InfoProceso | undefined;
  readonly listos: ReadonlyArray<InfoProceso>;
  readonly esperandoMemoria: ReadonlyArray<InfoProceso>;
  readonly bloqueados: ReadonlyArray<InfoProceso>;
  readonly terminados: ReadonlyArray<InfoProceso>;
  readonly mapaMemoria: ReadonlyArray<InfoBloque>;
}
