import { CuentaForm } from "@/components/CuentaForm";

export default function NuevaCuentaPage() {
  return (
    <div className="mx-auto max-w-[560px]">

      <h1 className="text-[19px] font-semibold tracking-[-0.02em] mb-4 text-fg">Agregar cuenta</h1>
      <CuentaForm />
    </div>
  );
}
