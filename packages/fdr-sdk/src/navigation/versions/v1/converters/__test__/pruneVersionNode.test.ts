import { Slug } from "../../../../../client/generated/api/resources/navigation/resources/v1";
import { toDefaultSlug } from "../../toDefaultSlug";

describe("toDefaultSlug", () => {
  it("should return the default slug", () => {
    expect(
      toDefaultSlug(
        Slug("basepath/version/page"),
        Slug("basepath"),
        Slug("basepath/version")
      )
    ).toEqual(Slug("basepath/page"));
  });

  it("should be noop if the slug doesn't start with the version slug", () => {
    expect(
      toDefaultSlug(
        Slug("basepath/page"),
        Slug("basepath"),
        Slug("basepath/version")
      )
    ).toEqual(Slug("basepath/page"));
  });
});
