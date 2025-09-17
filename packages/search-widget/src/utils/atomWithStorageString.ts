import identity from "@fern-api/ui-core-utils/identity";
import { atomWithStorageValidation } from "./atomWithStorageValidation";
import { z } from "zod";

export function atomWithStorageString<VALUE extends string>(
    key: string,
    value: VALUE,
    {
      validate,
      getOnInit,
    }: {
      validate?: z.ZodType<VALUE>;
      getOnInit?: boolean;
    } = {}
  ): ReturnType<typeof atomWithStorageValidation<VALUE>> {
    return atomWithStorageValidation<VALUE>(key, value, {
      validate,
      serialize: identity,
      parse: validate?.parse?.bind(validate),
      getOnInit,
    });
  }
  