import type { SVGProps } from "react";

import {
  ChevronsLeftRight,
  FileText,
  Hash,
  History,
  Webhook,
} from "lucide-react";

import { FaIcon } from "@fern-docs/components";

export const PageIcon = ({
  icon,
  type,
  isSubPage,
  ref,
  ...props
}: SVGProps<SVGSVGElement> & {
  icon: string | undefined;
  type: string | undefined;
  isSubPage?: boolean;
}): JSX.Element => {
  if (icon) {
    return <FaIcon icon={icon} ref={ref} {...props} />;
  }

  if (type === "changelog") {
    return <History ref={ref} {...props} />;
  }

  if (type === "webhook") {
    return <Webhook ref={ref} {...props} />;
  }

  // if (type === "websocket") {
  //     return <ChevronsLeftRightEllipsis ref={ref} {...props} />;
  // }

  if (type === "http" || type === "webhook" || type === "websocket") {
    return <ChevronsLeftRight ref={ref} {...props} />;
  }

  if (isSubPage) {
    return <Hash ref={ref} {...props} />;
  }

  return <FileText ref={ref} {...props} />;
};
