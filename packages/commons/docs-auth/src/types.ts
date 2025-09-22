import { z } from "zod";

export type PlaygroundState = {
  auth?: {
    bearer_token?: string;
    basic?: {
      username: string;
      password: string;
    };
  };
  headers?: Record<string, string>;
  path_parameters?: Record<string, any>;
  query_parameters?: Record<string, any>;
};

export const PlaygroundStateSchema: z.ZodType<PlaygroundState> = z.object({
  auth: z
    .object({
      bearer_token: z
        .string()
        .optional()
        .describe("Bearer token to set in the request"),
      basic: z
        .object({
          username: z.string(),
          password: z.string(),
        })
        .optional(),
    })
    .optional(),
  headers: z
    .record(z.string(), z.string())
    .optional()
    .describe("Headers to set in the request"),
  path_parameters: z
    .record(z.string(), z.any())
    .optional()
    .describe("Path parameters to set in the request"),
  query_parameters: z
    .record(z.string(), z.any())
    .optional()
    .describe("Query parameters to set in the request"),
  // TODO: support body injection (potentially leveraging jsonpath?) — need a way to support different content types, and different spec types
});

export type FernUser = {
  name?: string;
  email?: string;
  roles?: string[];
  api_key?: string;
};

export const FernUserSchema: z.ZodType<FernUser> = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  roles: z
    .array(z.string())
    .describe(
      "The roles of the token (can be a string or an array of strings) which limits what content users can access"
    )
    .optional(),

  // TODO: deprecate this
  api_key: z.string().optional().describe("For API Playground key injection"),

  /**
   * when the user logs in, there may be some initial state in the API playground that we can replace with the user's information (i.e. api key, organization, project id, etc.)
   *
   * the initial state will be merged into each request if it's compatible with the api endpoint's spec.
   *
   * Example claim:
   * ```
   * {
   *     "playground": {
   *         "initial_state": {
   *             "auth": {
   *                 "bearer_token": "abc123"
   *             }
   *         }
   *     }
   * }
   *
   * there is an environment-specific state that will be merged into a request
   * if the selected environment matches the key of the env_state record
   *
   *    * Example claim:
   * ```
   * {
   *     "playground": {
   *         "env_state": {
   *             "prod.example.api": {
   *                "auth": {
   *                  "bearer_token": "abc123"
   *                }
   *             },
   *             "dev.example.api": {
   *                "auth": {
   *                  "bearer_token": "123abc"
   *                }
   *             }
   *         }
   *     }
   * }
   */
  playground: z
    .object({
      initial_state: PlaygroundStateSchema.optional(),
      env_state: z.record(z.string(), PlaygroundStateSchema).optional(),
    })
    .optional(),
});

export type PathnameViewerRules = {
  allowlist?: string[];
  denylist?: string[];
  anonymous?: string[];
};

export const PathnameViewerRulesSchema: z.ZodType<PathnameViewerRules> =
  z.object({
    allowlist: z
      .array(z.string())
      .describe(
        "List of pages (regexp allowed) that are public and do not require authentication"
      )
      .optional(),
    denylist: z
      .array(z.string())
      .describe(
        "List of pages (regexp allowed) that are private and require authentication"
      )
      .optional(),
    anonymous: z
      .array(z.string())
      .describe(
        "List of pages (regexp allowed) that are public and do not require authentication, but are hidden when the user is authenticated"
      )
      .optional(),
  });

export type SSOWorkOS = {
  type: "sso";
  partner: "workos";
  organization: string;
  connection?: string;
  provider?: string;
  domainHint?: string;
  loginHint?: string;
} & PathnameViewerRules;

// WorkOS is our only SSO provider for now, and is meant for private docs.
export const SSOWorkOSSchema: z.ZodType<SSOWorkOS> = z
  .object({
    type: z.literal("sso"),
    partner: z.literal("workos"),
    organization: z
      .string()
      .describe("This should be the org name, NOT the org ID"),
    connection: z
      .string()
      .optional()
      .describe(
        "The WorkOS SSO connection ID to use for authentication (if you want to skip Authkit)"
      ),
    provider: z
      .string()
      .optional()
      .describe("Provider (if you want to skip Authkit for social login)"),
    domainHint: z.string().optional().describe("Domain hint for social login"),
    loginHint: z.string().optional().describe("Login hint for social login"),
  })
  .and(PathnameViewerRulesSchema);

export type APIPlaygroundEdgeConfig = {
  "api-key-injection-enabled"?: boolean;
};

export const APIPlaygroundEdgeConfigSchema: z.ZodType<APIPlaygroundEdgeConfig> =
  z.object({
    "api-key-injection-enabled": z
      .optional(z.boolean())
      .describe(
        "When true, API playground will render a login box instead of the API key input"
      ),
  });

export type OAuth2Shared = {
  type: "oauth2";
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
} & APIPlaygroundEdgeConfig &
  PathnameViewerRules;

export const OAuth2SharedSchema: z.ZodType<OAuth2Shared> = z
  .object({
    type: z.literal("oauth2"),
    clientId: z.string(),
    clientSecret: z.string(),
    redirectUri: z.string().optional(),
  })
  .and(APIPlaygroundEdgeConfigSchema)
  .and(PathnameViewerRulesSchema);

export type OAuth2Ory = {
  partner: "ory";
  environment: string;
  jwks?: string;
  scope?: string;
} & OAuth2Shared;

export const OAuth2OrySchema: z.ZodType<OAuth2Ory> = z
  .object({
    partner: z.literal("ory"),
    environment: z.string(),
    jwks: z.optional(z.string()),
    scope: z.optional(z.string()),
  })
  .and(OAuth2SharedSchema);

export type OAuth2Webflow = {
  partner: "webflow";
  scope?: string | string[];
} & OAuth2Shared;

export const OAuth2WebflowSchema: z.ZodType<OAuth2Webflow> = z
  .object({
    partner: z.literal("webflow"),
    scope: z.optional(z.union([z.string(), z.array(z.string())])),
  })
  .and(OAuth2SharedSchema);

export type OAuth2ClientCredentials = {
  partner: string;
  auth_endpoint: string;
  token_endpoint: string;
  scope?: string | string[];
  issuer?: string;
} & OAuth2Shared;

// used for generalized authorization_code oauth2 flow
export const OAuth2ClientCredentialsSchema: z.ZodType<OAuth2ClientCredentials> =
  z
    .object({
      // todo: deprecate the refinement once webflow is migrated to generalized flow
      partner: z.string().refine((val) => val !== "ory" && val !== "webflow", {
        message:
          "Partner cannot be 'ory' or 'webflow' as they have their own specific schemas",
      }),
      auth_endpoint: z.string(),
      token_endpoint: z.string(),
      scope: z.optional(z.union([z.string(), z.array(z.string())])),
      issuer: z.optional(z.string()),
    })
    .and(OAuth2SharedSchema);

export type OAuth2 = OAuth2ClientCredentials | OAuth2Ory | OAuth2Webflow;

// TODO: remove ory
// TODO: migrate webflow to generalized authorization_code
export const OAuth2Schema: z.ZodType<OAuth2> = z.union([
  OAuth2ClientCredentialsSchema,
  OAuth2OrySchema,
  OAuth2WebflowSchema,
]);

export type OAuth2TokenResponse = {
  access_token: string;
  refresh_token: string;
  issuer: string;
  expires_in: number;
  roles?: string | string[];
};

export const OAuth2TokenSchema: z.ZodType<OAuth2TokenResponse> = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  issuer: z.string(),
  expires_in: z.number(),
  roles: z.optional(z.union([z.string(), z.array(z.string())])),
});

export type BasicTokenVerification = {
  type: "basic_token_verification";
  secret: string;
  issuer: string;
  redirect: string;
  logout?: string;
  returnToQueryParam?: string;
} & APIPlaygroundEdgeConfig &
  PathnameViewerRules;

export const BasicTokenVerificationSchema: z.ZodType<BasicTokenVerification> = z
  .object({
    type: z.literal("basic_token_verification"),
    secret: z.string(),
    issuer: z.string(),
    redirect: z.string(),
    logout: z.string().optional(),
    returnToQueryParam: z
      .string()
      .optional()
      .describe(
        "By default, this is 'state' because most auth platforms are able to support carrying over the state query parameter. Override this to `return_to` if the state parameter conflicts with the customer's auth provider in any way."
      ),
  })
  .and(APIPlaygroundEdgeConfigSchema)
  .and(PathnameViewerRulesSchema);

export type AuthEdgeConfig = SSOWorkOS | OAuth2 | BasicTokenVerification;

export const AuthEdgeConfigSchema: z.ZodType<AuthEdgeConfig> = z.union([
  SSOWorkOSSchema,
  OAuth2Schema,
  BasicTokenVerificationSchema,
]);

export type OAuthTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
};

export const OAuthTokenResponseSchema: z.ZodType<OAuthTokenResponse> = z.object(
  {
    access_token: z.string(),
    expires_in: z.number(),
    refresh_token: z.string().optional(),
    scope: z.string(),
    token_type: z.string(),
  }
);

export type RightbrainUser = {
  avatar_url?: string;
  email?: string;
  name?: string;
  org_id?: string;
  project_id?: string;
  sso_email_verified?: boolean;
};

export const RightbrainUserSchema: z.ZodType<RightbrainUser> = z.object({
  avatar_url: z.string().optional(),
  email: z.string().optional(),
  name: z.string().optional(),
  org_id: z.string().optional(),
  project_id: z.string().optional(),
  sso_email_verified: z.boolean().optional(),
});

export type OryAccessToken = {
  aud: string[];
  client_id?: string;
  exp?: number;
  ext?: RightbrainUser;
  iat?: number;
  iss?: string;
  jti?: string;
  nbf?: number;
  scp: string[];
  sub?: string;
};

export const OryAccessTokenSchema: z.ZodType<OryAccessToken> = z.object({
  aud: z.array(z.string()),
  client_id: z.string().optional(),
  exp: z.number().optional(),
  ext: RightbrainUserSchema.optional(),
  iat: z.number().optional(),
  iss: z.string().optional(),
  jti: z.string().optional(),
  nbf: z.number().optional(),
  scp: z.array(z.string()),
  sub: z.string().optional(),
});

export type Jwk = {
  kty: string;
  use?: string;
  key_ops?: string[];
  alg?: string;
  kid?: string;
  x5u?: string;
  x5c?: string[];
  x5t?: string;
  "x5t#S256"?: string;
};

export const JwkSchema: z.ZodType<Jwk> = z.object({
  kty: z.string().describe("Key Type"),
  use: z.string().optional().describe("Public Key Use"),
  key_ops: z.array(z.string()).optional().describe("Key Operations"),
  alg: z.string().optional().describe("Algorithm"),
  kid: z.string().optional().describe("Key ID"),
  x5u: z.string().optional().describe("X.509 URL"),
  x5c: z.array(z.string()).optional().describe("X.509 Certificate Chain"),
  x5t: z.string().optional().describe("X.509 Certificate SHA-1 Thumbprint"),
  "x5t#S256": z
    .string()
    .optional()
    .describe("X.509 Certificate SHA-256 Thumbprint"),
});

export type Jwks = {
  keys: Jwk[];
};

export const JwksSchema: z.ZodType<Jwks> = z.object({
  keys: z.array(JwkSchema).describe("Array of JWKs"),
});

export type ApiKeyDemo = {
  apiKey: string;
  secret: string;
  payload?: {
    fern: FernUser;
  };
};

export const ApiKeySchema: z.ZodType<ApiKeyDemo> = z.object({
  apiKey: z.string(),
  secret: z.string(),
  payload: z
    .object({
      fern: FernUserSchema,
    })
    .optional(),
});
