// esqueleto del inicio: replica la composicion real (hero con grafico a todo
// el ancho, columna principal y riel) para que la carga no salte de layout.
// va dentro de AppShell, asi que no dibuja su propio header.
function Fila() {
  return (
    <div className="flex items-center justify-between gap-3 py-3.5">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="skeleton h-3.5 w-40" />
        <div className="skeleton h-2.5 w-24" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="skeleton h-3.5 w-24" />
        <div className="skeleton h-2.5 w-14" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="flex flex-col gap-5 lg:gap-6" aria-busy="true" aria-label="Cargando tu portafolio">
      <section className="card px-5 pt-6 pb-5 sm:px-7 sm:pt-7">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-10">
          <div>
            <div className="skeleton h-3.5 w-28" />
            <div className="skeleton mt-3 h-12 w-64 max-w-full" />
            <div className="skeleton mt-4 h-6 w-48 rounded-full" />
          </div>
          <div className="skeleton h-[150px] w-full rounded-2xl" />
        </div>
        <div className="skeleton mt-8 h-[230px] w-full sm:h-[320px]" />
      </section>
      <div className="grid grid-cols-1 items-start gap-5 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="card px-5 py-3">
          <Fila />
          <Fila />
          <Fila />
          <Fila />
        </section>
        <section className="card p-5">
          <div className="skeleton h-3.5 w-24" />
          <div className="skeleton mt-4 h-10 w-full" />
          <div className="skeleton mt-3 h-10 w-full" />
          <div className="skeleton mt-3 h-10 w-full" />
        </section>
      </div>
    </div>
  );
}
