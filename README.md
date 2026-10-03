# Simulación de procesos y memoria

Proyecto TypeScript para simular la gestión de procesos, memoria contigua y planificación RR (Round Robin) con ticks discretos.

## Qué incluye

- Modelado de procesos con estados y eventos de E/S.
- Administración de memoria contigua con políticas de asignación:
  - Primer ajuste
  - Mejor ajuste
  - Peor ajuste
- Planificador Round Robin con quantum configurable.
- Estado del simulador en cada tick.
- Métricas de uso de CPU y memoria.

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

## Estado del proyecto

La base funcional del simulador ya está implementada y validada con pruebas automáticas. El trabajo restante, si se desea, es pulir la documentación y afinar detalles de experiencia de uso en la interfaz del proyecto.

