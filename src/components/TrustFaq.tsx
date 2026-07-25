const PREGUNTAS = [
  {
    pregunta: "¿Pueden ver mi plata?",
    respuesta:
      "No. La app no se conecta a tu banco ni a ninguna institución financiera — solo ves y controlas tú los valores que ingresas manualmente. Nadie más, ni nosotros, tiene acceso a tu cuenta bancaria real.",
  },
  {
    pregunta: "¿Necesito darles mis claves bancarias?",
    respuesta:
      "Nunca. No te pedimos claves de tu banco ni de ninguna plataforma. Tú simplemente escribes el valor que ves en tu estado de cuenta — no hay conexión automática ni scraping de ningún tipo.",
  },
  {
    pregunta: "¿Qué pasa si cierro mi cuenta?",
    respuesta:
      "Puedes dejar de usarla cuando quieras. Si además quieres que eliminemos tu cuenta y tus datos, escríbenos y lo hacemos por ti.",
  },
  {
    pregunta: "¿Cómo protegen mis datos?",
    respuesta:
      "Cada usuario solo puede ver sus propios datos — está forzado a nivel de base de datos, no solo en la pantalla. Todo viaja cifrado, y tu contraseña nunca la vemos nosotros: la gestiona el proveedor de autenticación.",
  },
];

// disclosure nativo de html (details/summary), igual que Ayuda.tsx -- no
// necesita "use client" ni estado de react, y funciona igual con click/tap
// en desktop y mobile.
export function TrustFaq() {
  return (
    <section className="mt-8">
      <div className="bg-white border border-[#E7E9EE] rounded-2xl divide-y divide-[#EEF0F4]">
        {PREGUNTAS.map((item) => (
          <details key={item.pregunta} className="group p-[18px]">
            <summary className="flex items-center justify-between gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="text-[13.5px] font-semibold text-[#171A20]">{item.pregunta}</span>
              <span className="text-[#8A929E] transition-transform duration-200 group-open:rotate-45 text-lg leading-none">
                +
              </span>
            </summary>
            <p className="mt-2.5 text-[13px] text-[#40474F] leading-relaxed">{item.respuesta}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
