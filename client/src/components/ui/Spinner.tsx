interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  const sizes = { sm: "w-3 h-3", md: "w-5 h-5", lg: "w-8 h-8" };
  return (
    <div
      className={`${sizes[size]} border-2 border-acid/20 border-t-acid rounded-full animate-spin ${className}`}
    />
  );
}
