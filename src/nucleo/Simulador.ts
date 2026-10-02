import { AdministradorMemoria } from "../memoria/AdministradorMemoria.js";
import { PrimerAjuste, type PoliticaAsignacion } from "../memoria/PoliticaAsignacion.js";
import { Proceso } from "../modelos/Proceso.js";
import { RoundRobinPlanificador } from "../planificador/RoundRobinPlanificador.js";
import type { EstadoSimulador, InfoMetricas } from "../tipos.js";

export class Simulador {
  private readonly _memoria: AdministradorMemoria;
  private readonly _planificador: RoundRobinPlanificador;
  private readonly _procesos = new Map<number, Proceso>();
  private readonly _esperandoMemoria: Proceso[] = [];
  private readonly _bloqueados: Proceso[] = [];
  private readonly _terminados: Proceso[] = [];
  private _tick: number;

  constructor(memoriaTotal: number, quantum: number, politica: PoliticaAsignacion = new PrimerAjuste()) {
    this._memoria = new AdministradorMemoria(memoriaTotal, politica);
    this._planificador = new RoundRobinPlanificador(quantum);
    this._tick = 0;
  }

  agregarProceso(proceso: Proceso): void {
    if (this._procesos.has(proceso.pid)) {
      throw new Error(`Ya existe un proceso con PID ${String(proceso.pid)}.`);
    }

    this._procesos.set(proceso.pid, proceso);

    if (this._memoria.asignar(proceso.pid, proceso.memoriaRequerida)) {
      proceso.admitir();
      this._planificador.encolar(proceso);
      return;
    }

    proceso.marcarEsperando();
    this._esperandoMemoria.push(proceso);
  }

  liberarProceso(pid: number): void {
    if (!this._procesos.has(pid)) {
      throw new Error(`No existe un proceso con PID ${String(pid)}.`);
    }

    this._memoria.liberar(pid);
    this._procesos.delete(pid);
  }

  tick(): void {
    this._tick += 1;
    this._intentarAdmitirProcesosEspera();

    const procesoActual = this._planificador.procesoEnCpu();
    const resultado = this._planificador.ejecutarTickCpu();

    if (resultado === "bloqueado" && procesoActual !== undefined) {
      this._bloqueados.push(procesoActual);
    }

    if (resultado === "terminado" && procesoActual !== undefined) {
      this._memoria.liberar(procesoActual.pid);
      this._procesos.delete(procesoActual.pid);
      this._terminados.push(procesoActual);
    }

    this._actualizarBloqueados();
    this._intentarAdmitirProcesosEspera();
  }

  obtenerEstado(): EstadoSimulador {
    return {
      tick: this._tick,
      procesoEnCpu: this._planificador.procesoEnCpu()?.obtenerInfo(),
      listos: this._planificador.obtenerColaListos().map((proceso) => proceso.obtenerInfo()),
      esperandoMemoria: this._esperandoMemoria.map((proceso) => proceso.obtenerInfo()),
      bloqueados: this._bloqueados.map((proceso) => proceso.obtenerInfo()),
      terminados: this._terminados.map((proceso) => proceso.obtenerInfo()),
      mapaMemoria: this._memoria.obtenerMapa(),
    };
  }

  obtenerMetricas(): InfoMetricas {
    const memoriaLibreTotal = this._memoria.memoriaLibreTotal();
    const mayorBloqueLibre = this._memoria.mayorBloqueLibre();
    const fragmentacionExterna = Math.max(0, memoriaLibreTotal - mayorBloqueLibre);

    return {
      tick: this._tick,
      ocupacionMemoria: this._memoria.memoriaOcupada(),
      utilizacionCpu: this._planificador.procesoEnCpu() !== undefined ? 100 : 0,
      cambiosDeContexto: this._planificador.obtenerCambiosDeContexto(),
      memoriaLibreTotal,
      mayorBloqueLibre,
      fragmentacionExterna,
    };
  }

  private _intentarAdmitirProcesosEspera(): void {
    for (let i = this._esperandoMemoria.length - 1; i >= 0; i -= 1) {
      const proceso = this._esperandoMemoria[i];
      if (proceso === undefined) continue;

      if (this._memoria.asignar(proceso.pid, proceso.memoriaRequerida)) {
        this._esperandoMemoria.splice(i, 1);
        proceso.admitir();
        this._planificador.encolar(proceso);
      }
    }
  }

  private _actualizarBloqueados(): void {
    for (let i = this._bloqueados.length - 1; i >= 0; i -= 1) {
      const proceso = this._bloqueados[i];
      if (proceso === undefined) continue;

      if (proceso.estado !== "BLOQUEADO") {
        this._bloqueados.splice(i, 1);
        continue;
      }

      proceso.decrementarES();
      if (proceso.ticksESRestantes === 0) {
        proceso.desbloquear();
        this._bloqueados.splice(i, 1);
        this._planificador.encolar(proceso);
      }
    }
  }
}
