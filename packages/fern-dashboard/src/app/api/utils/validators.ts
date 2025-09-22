import { z } from "zod";

import type { Auth0OrgName, Auth0UserID } from "@/app/services/auth0/types";

export const userIdValidator: z.ZodType<Auth0UserID, z.ZodTypeDef, string> = z
  .string()
  .refine((orgName: string): orgName is Auth0UserID => true);

export const orgNameValidator: z.ZodType<Auth0OrgName, z.ZodTypeDef, string> = z
  .string()
  .refine((orgName: string): orgName is Auth0OrgName => true);
