import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PublicFooter } from "@/components/PublicFooter";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Mi portafolio",
  description: "Artículos sobre cómo medir el rendimiento real de tus inversiones en Chile.",
  alternates: { canonical: "/blog" },
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
        <Link href="/" className="text-[13px] font-medium text-[#97A2B4] no-underline">
          ← volver al inicio
        </Link>
      </header>

      <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-[#F2F5F9]">Blog</h1>
      <p className="mt-3 text-[14px] text-[#97A2B4] max-w-[560px]">
        Artículos sobre cómo medir el rendimiento real de tus inversiones, sin confundir aportes
        con ganancias.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {posts.length === 0 ? (
          <p className="text-[13.5px] text-[#8892A0]">Todavía no hay artículos publicados.</p>
        ) : (
          posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block bg-[rgba(22,27,38,0.55)] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl p-5 no-underline hover:border-white/[0.2] transition-colors"
            >
              <p className="text-[11px] text-[#8892A0] font-mono-tabular">{formatoFecha(post.date)}</p>
              <h2 className="mt-1 text-[16px] font-semibold text-[#F2F5F9]">{post.title}</h2>
              {post.description && (
                <p className="mt-1.5 text-[13px] text-[#97A2B4] leading-relaxed">{post.description}</p>
              )}
            </Link>
          ))
        )}
      </div>

      <PublicFooter />
    </main>
  );
}
