# Simulación de procesos y memoria

Proyecto TypeScript para simular la gestión de procesos, memoria contigua y planificación RR (Round Robin) con ticks discretos.

## Objetivo del sistema

Este proyecto simula un sistema operativo básico con:

- creación y gestión de procesos;
- asignación de memoria contigua;
- políticas de colocación de memoria;
- planificación de CPU mediante Round Robin;
- eventos de E/S y estados de proceso;
- métricas del estado global del sistema.

La simulación se ejecuta en ticks discretos, donde cada tick representa una unidad de tiempo del sistema.

## Instalación

```bash
npm install
```

## Uso básico

```ts
import { Proceso, Simulador } from "sim-procesos-memoria";

const simulador = new Simulador(1024, 2);
const procesoA = new Proceso(1, 128, 5);
const procesoB = new Proceso(2, 256, 4);

simulador.agregarProceso(procesoA);
simulador.agregarProceso(procesoB);

for (let i = 0; i < 10; i += 1) {
  simulador.tick();
  console.log(simulador.obtenerEstado());
}
```

## Ejecución de pruebas

```bash
npm test
```

## Compilación

```bash
npm run build
```
