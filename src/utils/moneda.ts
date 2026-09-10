export function formatearSoles(valor: number): string {
  const seguro = Number.isFinite(valor) ? valor : 0;
  return `S/ ${seguro.toFixed(2)}`;
}
