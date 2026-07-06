interface FeedbackLinkProps {
  className?: string;
  children?: React.ReactNode;
}

export function FeedbackLink({ className, children }: FeedbackLinkProps) {
  return (
    <a href="mailto:alonso.hsolis@gmail.com" className={className}>
      {children ?? "¿algo no funciona o tienes una idea? escríbenos"}
    </a>
  );
}
