import type { AuthState } from "@fern-api/docs-server/auth/getAuthState";
import { createFileResolver } from "@fern-api/docs-server/file-resolver";
import { getProducts } from "@fern-api/docs-server/handle-node-fallbacks";
import type { FileData } from "@fern-api/docs-utils/types/file-data";
import type { FernNavigation } from "@fern-api/fdr-sdk";
import Image from "next/image";
import { processIcon } from "../processIcon";
import { ProductDropdownClient, type ProductDropdownItem } from "./ProductDropdownClient";

export declare namespace ProductDropdown {
    export interface Props {}
}

export function ProductDropdown({
    fallbackProduct,
    useDenseLayout = false,
    root,
    isAuthenticatedPagesDiscoverable,
    authState,
    files
}: {
    fallbackProduct: FernNavigation.ProductNode;
    useDenseLayout?: boolean;
    root: FernNavigation.RootNode;
    isAuthenticatedPagesDiscoverable: boolean;
    authState: AuthState;
    files: Record<string, FileData>;
}) {
    if (root.child.type !== "productgroup") {
        return null;
    }

    const showHiddenNodes = isAuthenticatedPagesDiscoverable;
    const roles = authState.authed ? (authState.user.roles ?? []) : [];

    const products = getProducts(root, showHiddenNodes, roles);

    if (products?.length === 0) {
        return null;
    }

    const resolveFileSrc = createFileResolver(files);

    const productOptions = products?.map((product: FernNavigation.ProductNode): ProductDropdownItem => {
        const slug = product.slug ?? product.pointsTo;
        const image = resolveFileSrc(product.image);
        return {
            productId: product.productId,
            title: product.title,
            slug,
            defaultSlug: product.default ? slug : undefined,
            icon: processIcon(product),
            subtitle: product.subtitle,
            default: product.default,
            image: image ? (
                <Image
                    src={image?.src}
                    alt={product.title}
                    objectFit="cover"
                    width={image.width || undefined}
                    height={image.height || undefined}
                />
            ) : undefined
        };
    });

    return (
        <ProductDropdownClient
            products={productOptions ?? []}
            fallbackProduct={fallbackProduct}
            useDenseLayout={useDenseLayout}
        />
    );
}
