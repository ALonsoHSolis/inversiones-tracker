import type { TipoCuenta } from "@/types/database";

export const TIPOS: { value: TipoCuenta; label: string }[] = [
  { value: "fondo_mutuo", label: "Fondo mutuo" },
  { value: "acciones", label: "Acciones" },
  { value: "deposito_plazo", label: "Deposito a plazo" },
  { value: "cripto", label: "Cripto" },
  { value: "otro", label: "Otro" },
];
