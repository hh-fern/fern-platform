import type { Auth0OrgName, Auth0UserID } from "@fern-dashboard/services/auth/types";
import { z } from "zod";

export const userIdValidator = z.string().refine((orgName: string): orgName is Auth0UserID => true);

export const orgNameValidator = z.string().refine((orgName: string): orgName is Auth0OrgName => true);
