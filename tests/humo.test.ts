/**
 * humo.test.ts
 *
 * Test de humo: verifica que la suite de Vitest puede ejecutarse.
 * Se eliminará o reemplazará cuando se implementen los módulos del dominio.
 */
import { describe, it, expect } from "vitest";
import * as index from "../src/index.js";

describe("scaffolding", () => {
  it("la suite de tests corre correctamente", () => {
    expect(index).toBeDefined();
    expect(1 + 1).toBe(2);
  });
});
