// componente preparado para cuando existan testimonios reales -- todavia no
// se importa ni se renderiza en ninguna pagina. mostrar citas inventadas a
// visitantes reales seria enganoso (mismo criterio ya aplicado en la seccion
// de confianza de la landing: nunca inventar testimonios o cifras de
// usuarios). reemplazar TESTIMONIOS con datos reales antes de usarlo.
const TESTIMONIOS = [
  {
    nombre: "TODO: nombre real del usuario",
    plataforma: "TODO: en qué plataforma invierte",
    cita: "TODO: cita real sobre su experiencia con la app.",
  },
  {
    nombre: "TODO: nombre real del usuario",
    plataforma: "TODO: en qué plataforma invierte",
    cita: "TODO: cita real sobre su experiencia con la app.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="mt-10">
      <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-center text-fg">
        Lo que dicen quienes ya lo usan
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {TESTIMONIOS.map((t, i) => (
          <div
            key={i}
            className="card p-5"
          >
            <p className="text-small text-fg-muted leading-relaxed">&quot;{t.cita}&quot;</p>
            <p className="mt-3 text-micro font-semibold text-fg">{t.nombre}</p>
            <p className="text-micro text-fg-muted">{t.plataforma}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
