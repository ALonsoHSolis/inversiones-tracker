import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

// los posts viven como archivos .md en content/blog/ (fuera de src/, igual
// que supabase/ en la raiz) -- publicar uno nuevo es agregar un archivo y
// hacer push, sin base de datos ni panel de administracion. formato esperado
// de cada archivo (frontmatter yaml + cuerpo en markdown):
//
// ---
// title: "Titulo del post"
// date: "2026-07-25"
// description: "Resumen corto para el listado y para SEO"
// ---
//
// contenido en markdown normal...
const POSTS_DIR = path.join(process.cwd(), "content", "blog");

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
}

export interface Post extends PostMeta {
  html: string;
}

function listarArchivos(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs.readdirSync(POSTS_DIR).filter((archivo) => archivo.endsWith(".md"));
}

export function getAllPosts(): PostMeta[] {
  return listarArchivos()
    .map((archivo) => {
      const slug = archivo.replace(/\.md$/, "");
      const contenido = fs.readFileSync(path.join(POSTS_DIR, archivo), "utf-8");
      const { data } = matter(contenido);
      return {
        slug,
        title: (data.title as string) ?? slug,
        date: (data.date as string) ?? "",
        description: (data.description as string) ?? "",
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): Post | null {
  const ruta = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(ruta)) return null;

  const contenido = fs.readFileSync(ruta, "utf-8");
  const { data, content } = matter(contenido);

  return {
    slug,
    title: (data.title as string) ?? slug,
    date: (data.date as string) ?? "",
    description: (data.description as string) ?? "",
    html: marked.parse(content, { async: false }),
  };
}
