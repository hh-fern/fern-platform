import { cn } from "@fern-api/docs-utils/cn";
import { useLogoText } from "@fern-ui/state/logo-text";

export function LogoText({ className }: { className?: string }) {
  const logoText = useLogoText();
  if (logoText == null) {
    return null;
  }

  return (
    <span
      className={cn(
        "font-heading text-(color:--accent) text-[1.5rem] font-light lowercase",
        className
      )}
    >
      {logoText}
    </span>
  );
}
