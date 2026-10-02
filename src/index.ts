export { Proceso } from "./modelos/Proceso.js";
export { AdministradorMemoria } from "./memoria/AdministradorMemoria.js";
export { BloqueMemoria } from "./memoria/BloqueMemoria.js";
export { PrimerAjuste, MejorAjuste, PeorAjuste } from "./memoria/PoliticaAsignacion.js";
export type { PoliticaAsignacion } from "./memoria/PoliticaAsignacion.js";
export { RoundRobinPlanificador } from "./planificador/RoundRobinPlanificador.js";
export type { ResultadoTick, Planificador } from "./planificador/Planificador.js";
export type {
  EstadoProceso,
  EventoES,
  InfoBloque,
  InfoProceso,
  InfoMetricas,
  EstadoSimulador,
} from "./tipos.js";
export { Simulador } from "./nucleo/Simulador.js";
