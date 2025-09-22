import type { ComponentProps, PropsWithChildren, ReactNode } from "react";

import { tunnel } from "@fern-ui/react-commons";

import { useFacetFilters } from "../search/useFacetFilters";
import { DesktopFilterDropdownMenu } from "./desktop-filter-dropdown-menu";

interface DesktopCommandBadgesProps {
  onDropdownClose?: () => void;
}

export const aboveInput: {
  In: (props: PropsWithChildren) => null;
  Out: () => ReactNode;
  useHasChildren: () => boolean;
} = tunnel();

export const DesktopCommandBadges = (
  props: DesktopCommandBadgesProps & ComponentProps<"div">
): JSX.Element | false => {
  const { onDropdownClose, children, ref, ...rest } = props;
  const { filters, setFilters } = useFacetFilters();
  const hasChildren = aboveInput.useHasChildren();

  if ((filters == null || filters.length === 0) && !hasChildren) {
    return false;
  }

  return (
    <div ref={ref} className="flex items-center gap-2 p-2 pb-0" {...rest}>
      {filters?.map((filter) => (
        <DesktopFilterDropdownMenu
          key={`${filter.facet}:${filter.value}`}
          filter={filter}
          filters={filters}
          removeFilter={() => {
            setFilters?.((prev) =>
              prev.filter((f) => f.facet !== filter.facet)
            );
          }}
          updateFilter={(value) => {
            setFilters?.((prev) =>
              prev.map((f) => (f.facet === filter.facet ? { ...f, value } : f))
            );
          }}
        />
      ))}
      <aboveInput.Out />
    </div>
  );
};

export const DesktopCommandAboveInput: (props: PropsWithChildren) => null =
  aboveInput.In;
