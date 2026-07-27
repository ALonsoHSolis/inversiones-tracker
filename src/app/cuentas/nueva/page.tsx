import Link from "next/link";
import { CuentaForm } from "@/components/CuentaForm";
import { Logo } from "@/components/Logo";

export default function NuevaCuentaPage() {
  return (
    <main className="max-w-[560px] mx-auto px-6 pt-[26px] pb-16">
      <div className="flex items-center justify-between gap-4 mb-6">
        <Logo />
        <Link href="/dashboard" className="text-[12.5px] text-[#8892A0] border-b border-white/[0.14]">
          ← volver al dashboard
        </Link>
      </div>

      <h1 className="text-[19px] font-semibold tracking-[-0.02em] mb-4 text-[#F2F5F9]">Agregar cuenta</h1>
      <CuentaForm />
    </main>
  );
}
