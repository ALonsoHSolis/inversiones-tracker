import type { MetadataRoute } from "next";

// habilita "agregar a la pantalla de inicio" en el celular -- util para una
// app que se revisa seguido. reutiliza el icon.png que ya existe (256x256),
// sin generar assets nuevos.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mi portafolio",
    short_name: "Mi portafolio",
    description: "Rendimiento real de tus inversiones, sin confundir aportes con ganancias.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F5F6F8",
    theme_color: "#14508C",
    icons: [
      {
        src: "/icon.png",
        sizes: "256x256",
        type: "image/png",
      },
    ],
  };
}
