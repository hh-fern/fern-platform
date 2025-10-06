import type * as FernDocs from "@fern-api/fdr-sdk/docs";
import {
    hasMetadata,
    hasRedirect,
    type NavigationNode,
    type NavigationNodePage,
    type Slug
} from "@fern-api/fdr-sdk/navigation";
import { withDefaultProtocol } from "@fern-api/ui-core-utils";
import urljoin from "url-join";

function toUrl(domain: string, slug: Slug): string {
    return urljoin(withDefaultProtocol(domain), slug);
}

export function getBreadcrumbList(
    domain: string,
    parents: readonly NavigationNode[],
    node: NavigationNodePage,
    title?: string
): FernDocs.JsonLdBreadcrumbList {
    title ??= node.title;

    const elements: FernDocs.JsonLdBreadcrumbListElement[] = [];
    const visitedSlugs = new Set<string>();

    parents.forEach((parent) => {
        if (hasMetadata(parent)) {
            const slug = visitedSlugs.has(parent.slug)
                ? hasRedirect(parent)
                    ? parent.pointsTo != null && !visitedSlugs.has(parent.pointsTo)
                        ? parent.pointsTo
                        : undefined
                    : undefined
                : parent.slug;
            if (slug != null && slug !== node.slug) {
                elements.push({
                    "@type": "ListItem",
                    position: elements.length + 1,
                    name: parent.title,
                    item: toUrl(domain, slug)
                });
                visitedSlugs.add(parent.slug);
            }
        }
    });

    // the current page is the last item in the breadcrumb
    elements.push(
        // JsonLd.listItem(elements.length + 1, title, toUrl(domain, node.slug))
        {
            "@type": "ListItem",
            position: elements.length + 1,
            name: title,
            item: toUrl(domain, node.slug)
        }
    );

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: elements
    };
}
