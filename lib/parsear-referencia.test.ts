import { describe, it, expect } from "vitest";
import { parsearReferencia } from "@/lib/parsear-referencia";

describe("parsearReferencia", () => {
  it("parsea 'Juan 3:16'", () => {
    expect(parsearReferencia("Juan 3:16")).toEqual({
      codigo: "JHN",
      capitulo: 3,
      versInicio: 16,
      versFin: 16,
    });
  });

  it("parsea rangos: 'Salmos 23:1-6'", () => {
    expect(parsearReferencia("Salmos 23:1-6")).toEqual({
      codigo: "PSA",
      capitulo: 23,
      versInicio: 1,
      versFin: 6,
    });
  });

  it("parsea libros con numero arabigo: '1 Corintios 13:4'", () => {
    expect(parsearReferencia("1 Corintios 13:4")).toEqual({
      codigo: "1CO",
      capitulo: 13,
      versInicio: 4,
      versFin: 4,
    });
  });

  it("parsea libros con numeros romanos: 'II Corintios 12:9-10'", () => {
    expect(parsearReferencia("II Corintios 12:9-10")).toEqual({
      codigo: "2CO",
      capitulo: 12,
      versInicio: 9,
      versFin: 10,
    });
  });

  it("parsea 'Filipenses 4:6-7'", () => {
    expect(parsearReferencia("Filipenses 4:6-7")).toEqual({
      codigo: "PHP",
      capitulo: 4,
      versInicio: 6,
      versFin: 7,
    });
  });

  it("parsea 'Apocalipsis 21:4'", () => {
    expect(parsearReferencia("Apocalipsis 21:4")).toEqual({
      codigo: "REV",
      capitulo: 21,
      versInicio: 4,
      versFin: 4,
    });
  });

  it("acepta singular: 'Salmo 23:1' → PSA", () => {
    expect(parsearReferencia("Salmo 23:1")?.codigo).toBe("PSA");
  });

  it("acepta abreviaturas: 'Sal 23:1' → PSA", () => {
    expect(parsearReferencia("Sal 23:1")?.codigo).toBe("PSA");
  });

  it("acepta nombre corto: 'Mt 5:4' → MAT", () => {
    expect(parsearReferencia("Mt 5:4")?.codigo).toBe("MAT");
  });

  it("acepta codigo OSIS directo: 'JHN 3:16'", () => {
    expect(parsearReferencia("JHN 3:16")?.codigo).toBe("JHN");
  });

  it("es case-insensitive: 'génesis 1:1'", () => {
    expect(parsearReferencia("génesis 1:1")?.codigo).toBe("GEN");
  });

  it("es accent-insensitive: 'Genesis 1:1'", () => {
    expect(parsearReferencia("Genesis 1:1")?.codigo).toBe("GEN");
  });

  it("tolera espacios extras", () => {
    expect(parsearReferencia("  Juan   3:16  ")).toEqual({
      codigo: "JHN",
      capitulo: 3,
      versInicio: 16,
      versFin: 16,
    });
  });

  it("permite capitulo entero sin versiculo: 'Salmos 23'", () => {
    expect(parsearReferencia("Salmos 23")).toEqual({
      codigo: "PSA",
      capitulo: 23,
    });
  });

  it("acepta variante 'primera': 'Primera Corintios 13:4'", () => {
    expect(parsearReferencia("Primera Corintios 13:4")?.codigo).toBe("1CO");
  });

  it("retorna null para libro inexistente", () => {
    expect(parsearReferencia("Macabeos 1:1")).toBeNull();
  });

  it("retorna null para input vacio", () => {
    expect(parsearReferencia("")).toBeNull();
  });

  it("retorna null para formato roto", () => {
    expect(parsearReferencia("solo texto sin numeros")).toBeNull();
  });

  it("retorna null si versFin < versInicio", () => {
    expect(parsearReferencia("Juan 3:16-10")).toBeNull();
  });

  it("retorna null si capitulo es 0", () => {
    expect(parsearReferencia("Juan 0:1")).toBeNull();
  });

  it("retorna null si versiculo es 0", () => {
    expect(parsearReferencia("Juan 3:0")).toBeNull();
  });

  it("acepta separador alternativo: 'Juan 3.16'", () => {
    expect(parsearReferencia("Juan 3.16")?.versInicio).toBe(16);
  });
});
