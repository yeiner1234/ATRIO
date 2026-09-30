/**
 * Resuelve con `valorSiExpira` si `promesa` no termina dentro de `ms`, o con
 * su error también convertido a `valorSiExpira` (nunca deja una promesa
 * colgada bloqueando el flujo que espera por ella).
 */
export function conLimiteDeTiempo<T>(promesa: Promise<T>, ms: number, valorSiExpira: T): Promise<T> {
  return new Promise((resolver) => {
    const temporizador = setTimeout(() => resolver(valorSiExpira), ms);
    promesa
      .then((valor) => {
        clearTimeout(temporizador);
        resolver(valor);
      })
      .catch((err) => {
        clearTimeout(temporizador);
        console.error('conLimiteDeTiempo: la promesa rechazó, se usa el valor de respaldo.', err);
        resolver(valorSiExpira);
      });
  });
}
