---
target: dashboard
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:/home/user/inversiones-tracker/src/app/(app)/dashboard/page.tsx"
target_fingerprint: "sha256:ca24cd25d1e2f80c232648deb2d93d1845a222aafd784f98c79df2b0cda9a417"
target_path: /home/user/inversiones-tracker/src/app/(app)/dashboard/page.tsx
timestamp: 2026-11-02T12-19-52Z
slug: src-app-app-dashboard-page-tsx
closed: true
---
# Crítica: dashboard (Operate) — 28/40 Bueno
Method: dual-agent (A revisión de diseño · B detector + navegador)

| # | Heurística | Puntaje |
|---|---|---|
| 1 | Visibilidad del estado | 3 |
| 2 | Lenguaje real | 3 |
| 3 | Control y libertad | 3 |
| 4 | Consistencia | 2 |
| 5 | Prevención de errores | 3 |
| 6 | Reconocer vs recordar | 2 |
| 7 | Flexibilidad | 3 |
| 8 | Estética y minimalismo | 3 |
| 9 | Recuperación de errores | 3 |
| 10 | Ayuda | 3 |

## Priority Issues
- [P1] Tres % por activo sin rótulo de período (fila "real" vs distribución acumulada vs anualizado); "Tu rendimiento real" duplica el héroe en Comparadores.
- [P2] Color contra DESIGN.md: champán en PALETA_COMPOSICION; verde en "Cumplida" y "Registro guardado".
- [P2] Carga rápida: no muestra último valor; sobrescribe el registro de hoy sin aviso.
- [P2] Comparadores caídos: dos celdas "No disponible".
- [P2] Error crudo de Supabase en "No se pudo guardar".
## Detector
4 advisory design-system-font-size (11 px barra móvil y pastilla Concentrado; 17 px título header). axe 0 violaciones; CLS 0.
## Menores
Leyenda aporte/retiro solo por color; "Registro"/"Registrar" inconsistente; "Ver cuentas" desde Actividad; selector trunca sin title.
