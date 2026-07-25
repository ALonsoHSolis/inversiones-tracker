import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { PublicFooter } from "@/components/PublicFooter";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} — Mi portafolio`,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
  };
}

function formatoFecha(fechaIso: string) {
  if (!fechaIso) return "";
  return new Date(fechaIso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  return (
    <main className="max-w-[680px] mx-auto px-6 pt-[26px] pb-16">
      <header className="flex items-center justify-between gap-4 mb-10">
        <Logo href="/" />
        <Link href="/blog" className="text-[13px] font-medium text-[#40474F] no-underline">
          ← volver al blog
        </Link>
      </header>

      <p className="text-[11px] text-[#8A929E] font-mono-tabular">{formatoFecha(post.date)}</p>
      <h1 className="mt-1.5 text-[26px] font-semibold tracking-[-0.02em]">{post.title}</h1>

      {/* el contenido viene de archivos .md del propio repo (no de input de
          usuarios) -- solo quien puede hacer push al repo agrega un post,
          asi que renderizarlo como html no es una superficie de xss. */}
      <article
        className="contenido-post mt-6 text-[14.5px] text-[#40474F] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />

      <div className="mt-10 pt-6 border-t border-[#E7E9EE] flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[13px] text-[#40474F]">¿Quieres ver tu propio rendimiento real?</p>
        <Link
          href="/signup"
          className="inline-flex items-center h-10 px-5 rounded-[9px] bg-[var(--accent)] text-white text-[13.5px] font-semibold no-underline whitespace-nowrap"
        >
          Crear cuenta gratis →
        </Link>
      </div>

      <PublicFooter />
    </main>
  );
}
