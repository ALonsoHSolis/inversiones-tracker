import Link from "next/link";
import { FeedbackLink } from "@/components/FeedbackLink";

export function PublicFooter() {
  return (
    <footer className="flex items-center justify-between gap-4 mt-10 pt-6 border-t border-[#E7E9EE]">
      <p className="text-[11.5px] text-[#B4BAC3]">Mi portafolio</p>
      <div className="flex items-center gap-4">
        <Link href="/terminos" className="text-[12.5px] text-[#8A929E] no-underline">
          términos
        </Link>
        <Link href="/privacidad" className="text-[12.5px] text-[#8A929E] no-underline">
          privacidad
        </Link>
        <Link href="/disclaimer" className="text-[12.5px] text-[#8A929E] no-underline">
          disclaimer
        </Link>
        <FeedbackLink className="text-[12.5px] text-[#8A929E] border-b border-[#DADEE4]" />
      </div>
    </footer>
  );
}
