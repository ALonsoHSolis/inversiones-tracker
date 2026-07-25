import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PublicFooter } from "@/components/PublicFooter";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Mi portafolio",
  description: "Artículos sobre cómo medir el rendimiento real de tus inversiones en Chile.",
};

function formatoFecha(fechaIso: string) {
  if (!fechaIso) return "";
  return new Date(fechaIso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="max-w-[820px] mx-auto px-6 pt-[26px] pb-16">
      <header className="flex items-center justify-between gap-4 mb-10">
        <Logo href="/" />
        <Link href="/" className="text-[13px] font-medium text-[#40474F] no-underline">
          ← volver al inicio
        </Link>
      </header>

      <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Blog</h1>
      <p className="mt-3 text-[14px] text-[#40474F] max-w-[560px]">
        Artículos sobre cómo medir el rendimiento real de tus inversiones, sin confundir aportes
        con ganancias.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {posts.length === 0 ? (
          <p className="text-[13.5px] text-[#8A929E]">Todavía no hay artículos publicados.</p>
        ) : (
          posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block bg-white border border-[#E7E9EE] rounded-2xl p-5 no-underline hover:border-[#C9CDD5] transition-colors"
            >
              <p className="text-[11px] text-[#8A929E] font-mono-tabular">{formatoFecha(post.date)}</p>
              <h2 className="mt-1 text-[16px] font-semibold text-[#171A20]">{post.title}</h2>
              {post.description && (
                <p className="mt-1.5 text-[13px] text-[#6B7280] leading-relaxed">{post.description}</p>
              )}
            </Link>
          ))
        )}
      </div>

      <PublicFooter />
    </main>
  );
}
