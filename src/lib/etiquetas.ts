const PALETA = [
  { bg: "bg-blue-50", texto: "text-blue-700" },
  { bg: "bg-purple-50", texto: "text-purple-700" },
  { bg: "bg-teal-50", texto: "text-teal-700" },
  { bg: "bg-amber-50", texto: "text-amber-700" },
  { bg: "bg-pink-50", texto: "text-pink-700" },
  { bg: "bg-indigo-50", texto: "text-indigo-700" },
];

// asigna un color de forma deterministica segun el texto (el mismo nombre
// siempre cae en el mismo color, sin tener que guardar el mapeo en ningun
// lado) -- un hash simple de la suma de character codes alcanza para
// repartir un puñado de plataformas/tipos entre la paleta.
export function colorParaEtiqueta(texto: string) {
  const suma = texto.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PALETA[suma % PALETA.length];
}
