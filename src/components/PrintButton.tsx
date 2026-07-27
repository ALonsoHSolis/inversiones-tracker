"use client";

// exporta un resumen del portafolio a pdf usando el dialogo nativo de
// "imprimir" del navegador (guardar como PDF ya es una opcion ahi en
// cualquier navegador moderno) -- sin agregar una libreria de pdf nueva. el
// css de impresion que oculta los controles y fuerza negro sobre blanco
// vive en globals.css (@media print / .no-print).
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="h-[34px] px-3.5 rounded-[9px] border border-white/[0.1] bg-white/[0.03] text-[13px] font-medium text-[#C7CDD6] hover:border-white/[0.2]"
    >
      Exportar a PDF
    </button>
  );
}
