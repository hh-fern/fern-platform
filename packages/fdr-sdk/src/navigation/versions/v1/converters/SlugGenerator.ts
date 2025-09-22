import { Slug } from "../../../../client/generated/api/resources/navigation/resources/v1";
import { slugjoin } from "../slugjoin";

export class SlugGenerator {
  public static init(baseSlug: string): SlugGenerator {
    return new SlugGenerator(baseSlug, undefined, undefined, baseSlug);
  }
  private constructor(
    private baseSlug: string,
    private productSlug: string | undefined,
    private versionSlug: string | undefined,
    private slug: string
  ) {}

  public get(): Slug {
    return Slug(slugjoin(this.slug));
  }

  public setProductSlug(productSlug: string): SlugGenerator {
    if (this.productSlug != null) {
      if (this.productSlug === slugjoin(this.baseSlug, productSlug)) {
        return this;
      }
      throw new Error("Product already set");
    }
    const slug = slugjoin(this.baseSlug, productSlug);
    if (this.baseSlug === productSlug) {
      throw new Error("Product slug is the same as base slug");
    }
    return new SlugGenerator(this.baseSlug, slug, this.versionSlug, slug);
  }

  public setVersionSlug(versionSlug: string): SlugGenerator {
    if (this.versionSlug != null) {
      // If we have a product slug, we should always join with it
      if (this.productSlug) {
        const expectedSlug = slugjoin(this.productSlug, versionSlug);
        if (this.versionSlug === expectedSlug) {
          return this;
        }
      } else {
        // Only check base slug join if we don't have a product
        if (this.versionSlug === slugjoin(this.baseSlug, versionSlug)) {
          return this;
        }
      }
      throw new Error("Version already set");
    }

    // When creating a new version slug, always include product if present
    const slug = this.productSlug
      ? slugjoin(this.productSlug, versionSlug)
      : slugjoin(this.baseSlug, versionSlug);

    if (this.baseSlug === versionSlug) {
      throw new Error("Version slug is the same as base slug");
    }

    return new SlugGenerator(this.baseSlug, this.productSlug, slug, slug);
  }

  public append(slug: string): SlugGenerator {
    return new SlugGenerator(
      this.baseSlug,
      this.productSlug,
      this.versionSlug,
      slugjoin(this.slug, slug)
    );
  }

  public set(slug: string): SlugGenerator {
    // Normalize the input slug
    slug = slugjoin(slug);

    // Helper function to create a new SlugGenerator with the given slug
    const createWithSlug = (newSlug: string) => {
      return new SlugGenerator(
        this.baseSlug,
        this.productSlug,
        this.versionSlug,
        newSlug
      );
    };

    // Helper function to get the remaining part of the slug after the base
    const getRemainingAfterBase = (fullSlug: string) =>
      fullSlug.substring(this.baseSlug.length);

    // Helper function to get the remaining part of the slug after the product
    const getRemainingAfterProduct = (fullSlug: string) => {
      if (this.productSlug && fullSlug.startsWith(this.productSlug)) {
        return fullSlug.substring(this.productSlug.length);
      }
      return fullSlug;
    };

    // If we have both product and version slugs
    if (this.productSlug != null && this.versionSlug != null) {
      // If the slug starts with the product, insert version
      if (slug.startsWith(this.productSlug)) {
        const remaining = getRemainingAfterProduct(slug);
        return createWithSlug(slugjoin(this.versionSlug, remaining));
      }

      // If the slug starts with the base, handle appropriately
      if (this.baseSlug.length > 0 && slug.startsWith(this.baseSlug)) {
        const remaining = getRemainingAfterBase(slug);
        return createWithSlug(slugjoin(this.baseSlug, remaining));
      }

      // Otherwise, join with version
      return createWithSlug(slugjoin(this.versionSlug, slug));
    }

    // If we have a version slug
    if (this.versionSlug != null) {
      if (slug.startsWith(this.versionSlug)) {
        return createWithSlug(slug);
      }

      if (this.baseSlug.length > 0 && slug.startsWith(this.baseSlug)) {
        return createWithSlug(
          slugjoin(this.versionSlug, getRemainingAfterBase(slug))
        );
      }

      return createWithSlug(slugjoin(this.versionSlug, slug));
    }

    // If we have a product slug
    if (this.productSlug != null) {
      if (slug.startsWith(this.productSlug)) {
        return createWithSlug(slug);
      }

      if (this.baseSlug.length > 0 && slug.startsWith(this.baseSlug)) {
        return createWithSlug(slugjoin(getRemainingAfterBase(slug)));
      }

      return createWithSlug(slugjoin(this.productSlug, slug));
    }

    // If we have a base slug
    if (this.baseSlug.length > 0) {
      if (slug.startsWith(this.baseSlug)) {
        return createWithSlug(slug);
      }

      return createWithSlug(slugjoin(this.baseSlug, slug));
    }

    // If no special handling is needed, just use the slug as is
    return createWithSlug(slug);
  }

  public apply({
    fullSlug,
    urlSlug,
    skipUrlSlug,
  }: {
    fullSlug?: string[];
    skipUrlSlug?: boolean;
    urlSlug: string;
  }): SlugGenerator {
    if (fullSlug != null) {
      return this.set(fullSlug.join("/"));
    }

    if (skipUrlSlug) {
      return this;
    }

    return this.append(urlSlug);
  }
}
