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
          background: "#171A20",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: "#14508C", display: "flex" }} />
          <div style={{ fontSize: 32, fontWeight: 600, color: "#AEB5C0", display: "flex" }}>Mi portafolio</div>
        </div>
        <div style={{ fontSize: 58, fontWeight: 700, marginTop: 28, maxWidth: 920, lineHeight: 1.15, display: "flex" }}>
          Todas tus inversiones en un solo lugar, con tu ganancia real.
        </div>
        <div style={{ fontSize: 26, color: "#8FE3C0", marginTop: 24, display: "flex" }}>
          No con espejismos — sin conectar tu banco.
        </div>
      </div>
    ),
    { ...size }
  );
}
