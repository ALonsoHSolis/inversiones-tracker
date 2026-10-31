"use client";

// exporta un resumen del portafolio a pdf usando el dialogo nativo de
// "imprimir" del navegador (guardar como PDF ya es una opcion ahi en
// cualquier navegador moderno) -- sin agregar una libreria de pdf nueva. el
// css de impresion que oculta los controles y fuerza negro sobre blanco
// vive en globals.css (@media print / .no-print).
export function PrintButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={className}
    >
      Exportar a PDF
    </button>
  );
}
