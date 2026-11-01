import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// imagen de preview generada con next/og (nativo de next, sin dependencias
// nuevas) -- sirve como fallback para cualquier pagina que no defina la suya
// propia. usa satori (no un motor html/css completo), asi que el layout se
// limita a flexbox y estilos inline.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #121a27 0%, #080d16 70%)",
          color: "#f5f7fb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: "#d8ba7c", display: "flex" }} />
          <div style={{ fontSize: 32, fontWeight: 600, color: "#a8b4c5", display: "flex" }}>Mi portafolio</div>
        </div>
        <div style={{ fontSize: 58, fontWeight: 700, marginTop: 28, maxWidth: 920, lineHeight: 1.15, display: "flex" }}>
          Todas tus inversiones en un solo lugar, con tu ganancia real.
        </div>
        <div style={{ fontSize: 26, color: "#ead3a2", marginTop: 24, display: "flex" }}>
          No con espejismos — sin conectar tu banco.
        </div>
      </div>
    ),
    { ...size }
  );
}
