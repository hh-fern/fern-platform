export enum DashboardError {
  FAILED_TO_ARCHIVE_SITE = "Failed to archive site",
  FAILED_TO_CREATE_ORGANIZATION = "Failed to create organization",
  FAILED_TO_PARSE_AUTH_HEADER = "Failed to parse auth header",
  FAILED_TO_LOAD_DOCS_URL_METADATA = "Failed to load docs URL metadata",
  FAILED_TO_GET_REPO_INFO = "Failed to get repo info",

  // Analytics errors
  FAILED_TO_FETCH_HISTOGRAM_DATA = "Failed to fetch histogram data",
  FAILED_TO_FETCH_QUERIES_DATA = "Failed to fetch queries data",
  FAILED_TO_EXPORT_CSV = "Failed to export CSV",

  // Member management errors
  FAILED_TO_REMOVE_MEMBER = "Failed to remove member",
  FAILED_TO_INVITE_USER = "Failed to invite user",
  FAILED_TO_RESEND_INVITATION = "Failed to resend invitation",

  // Editor errors
  FAILED_TO_COMMIT_CHANGES = "Failed to commit changes",

  // Component errors
  ERROR_BOUNDARY_FALLBACK = "Component error boundary triggered",
  FONTAWESOME_ICON_ERROR = "FontAwesome icon rendering error",
  TWOSLASH_COMPONENT_ERROR = "TwoSlash component error",
  TEMPLATE_COMPONENT_ERROR = "Template component error",
  DOWNLOAD_COMPONENT_ERROR = "Download component error",

  // GitHub integration errors
  FAILED_TO_SET_GITHUB_SOURCE = "Failed to set GitHub source",
  FAILED_TO_CHECK_BRANCH_EXISTENCE = "Failed to check branch existence",
  FAILED_TO_CREATE_PR = "Failed to create PR",
  FAILED_TO_GENERATE_PR_DESCRIPTION = "Failed to generate PR description",
  FAILED_TO_UPDATE_PR = "Failed to update PR",
  FAILED_TO_GET_PR_INFO = "Failed to get PR info",
  FAILED_TO_GET_PR_DIFF = "Failed to get PR diff",

  // API errors
  DASHBOARD_API_REQUEST_FAILED = "Dashboard API request failed",
  FAILED_TO_DESERIALIZE_REQUEST_BODY = "Failed to deserialize request body",
  FAILED_TO_LOAD_DOCS_SITES = "Failed to load docs sites",
  FAILED_TO_GET_SESSION_DATA = "Failed to get session data",
  FAILED_TO_GET_DOCS_URL_OWNER = "Failed to get docs URL owner",

  // Edge config errors
  FAILED_TO_CHECK_ORG_FLAG = "Failed to check organization flag",

  // UI state errors
  FAILED_TO_LOAD_LOGO = "Failed to load organization logo",

  // Auth errors
  HOMEPAGE_IMAGES_AUTH_INVALID_SIGNATURE = "Invalid signature for homepage images",
  HOMEPAGE_IMAGES_AUTH_MISSING_HEADER = "Missing auth header for homepage images",

  // PR Description service errors
  FAILED_TO_GENERATE_PR_TITLE = "Failed to generate PR title",
  FAILED_TO_GENERATE_PR_TITLE_AND_DESCRIPTION = "Failed to generate PR title and description",
  FAILED_TO_PARSE_AI_RESPONSE = "Failed to parse AI response",
  FAILED_TO_GENERATE_TITLE_FROM_DIFF = "Failed to generate title from diff",
  FAILED_TO_GENERATE_TITLE_AND_DESCRIPTION_FROM_DIFF = "Failed to generate title and description from diff",
  FAILED_TO_UPDATE_PR_TITLE_AND_DESCRIPTION = "Failed to update PR title and description",
  FAILED_TO_UPDATE_PR_TITLE = "Failed to update PR title",

  // Request validation errors
  FAILED_TO_VALIDATE_REQUEST_BODY = "Failed to validate request body",
}
