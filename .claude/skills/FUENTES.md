# Skills de terceros

Copiadas tal cual (sin modificar) desde sus repos públicos el 2026-11-02:

| Carpeta | Repo | Commit | Licencia |
|---|---|---|---|
| `emil-design-eng/` | https://github.com/emilkowalski/skills (`skills/emil-design-eng`) | a81dbca | MIT |
| `impeccable/` | https://github.com/pbakaus/impeccable (`.claude/skills/impeccable`) | e89e3ad | Apache 2.0 |
| `taste-skill/` | https://github.com/Leonxlnx/taste-skill (`skills/taste-skill`) | 12af471 | MIT |

Notas:
- `impeccable/scripts/impeccable` descarga su motor desde los releases de GitHub del autor y lo verifica contra `engine-checksums.txt`. Su hook de detector (`/impeccable hooks on`) NO está activado.
- `taste-skill/scripts/` lanza un Chromium headless local (Node 22+) y guarda historial en `~/.taste-skill/`.
- Estas skills son de diseño: no cambian las reglas de negocio de `CLAUDE.md`, que mandan sobre cualquier sugerencia de ellas.
- Para actualizar: volver a copiar la carpeta desde el repo y cambiar el commit en esta tabla.
