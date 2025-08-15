import { Button } from "../ui/button";

export declare namespace HeaderLinkButton {
  export interface Props {
    text: string;
    href: string;
    icon?: React.ReactNode;
    className?: string;
  }
}

export function HeaderLinkButton({
  text,
  href,
  icon,
  className,
}: HeaderLinkButton.Props) {
  return (
    <Button size="sm" variant="ghost" asChild className={className}>
      <a href={href} target="_blank">
        {icon}
        {text}
      </a>
    </Button>
  );
}
