// Wrapper sobre Transformers.js para producir embeddings semanticos en Node.
//
// Modelo: intfloat/multilingual-e5-small (384 dim, ~110MB ONNX quantizado).
// Convencion de E5: prefijar "passage: " para textos del corpus y "query: "
// para consultas. La similitud que mejor funciona es coseno.
//
// Carga lazy: el modelo solo se baja la primera vez que se llama a embed().
// Pensado para correr en scripts de seed; el runtime de la app NO depende
// de este modulo (usa embeddings precomputados desde la DB / JSON).

const MODEL_ID = "Xenova/multilingual-e5-small";

// Pipeline tiene un tipo union complejo en la libreria que no se puede
// reducir a feature-extraction sin colapsar. Usamos unknown opaco.
let _pipe: unknown = null;

async function getPipeline(): Promise<unknown> {
  if (_pipe) return _pipe;
  const { pipeline, env } = await import("@xenova/transformers");
  env.allowLocalModels = false;
  _pipe = await pipeline("feature-extraction", MODEL_ID, { quantized: true });
  return _pipe;
}

export type Modo = "passage" | "query";

/**
 * Embed un texto (o batch) y devuelve vectores normalizados L2 (listos
 * para similitud coseno via producto punto).
 */
export async function embed(textos: string | string[], modo: Modo): Promise<number[][]> {
  const prefix = modo === "query" ? "query: " : "passage: ";
  const lista = Array.isArray(textos) ? textos : [textos];
  const prefixed = lista.map((t) => `${prefix}${t.replace(/\s+/g, " ").trim()}`);

  const pipe = await getPipeline();
  const output = await (pipe as unknown as (
    input: string | string[],
    opts?: { pooling?: string; normalize?: boolean },
  ) => Promise<{ data: Float32Array | number[]; dims: number[] }>)(prefixed, {
    pooling: "mean",
    normalize: true,
  });

  // output.data es Float32Array aplanado: [batchSize × hiddenDim]
  const [batch, dim] = output.dims;
  const data = output.data as Float32Array;
  const matriz: number[][] = [];
  for (let i = 0; i < batch; i++) {
    matriz.push(Array.from(data.slice(i * dim, (i + 1) * dim)));
  }
  return matriz;
}

/** Helper: cosine similarity entre dos vectores ya normalizados (= dot product). */
export function cosineSim(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i]! * b[i]!;
  return s;
}
