import nextConfig from "eslint-config-next";

const config = [
  ...nextConfig,
  // .claude/ trae skills de terceros (ver .claude/skills/FUENTES.md): no es
  // codigo de la app y no se mantiene con las reglas del proyecto.
  { ignores: [".claude/**"] },
];

export default config;
