export function esVersionAnterior(version: string, versionReferencia: string): boolean {
  const partesVersion = version.split('.').map((parte) => parseInt(parte, 10) || 0);
  const partesReferencia = versionReferencia.split('.').map((parte) => parseInt(parte, 10) || 0);

  for (let i = 0; i < 3; i += 1) {
    const actual = partesVersion[i] ?? 0;
    const referencia = partesReferencia[i] ?? 0;
    if (actual !== referencia) return actual < referencia;
  }
  return false;
}
