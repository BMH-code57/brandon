declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    SECRET_PASSWORD_VERIFIER?: string;
    SECRET_SESSION_KEY?: string;
    SECRET_ALLOWED_ORIGIN?: string;
    QUIET_CHAMBER_CONTENT?: string;
    QUIET_CHAMBER_CONTENT_2?: string;
    QUIET_CHAMBER_CONTENT_3?: string;
    QUIET_CHAMBER_CONTENT_4?: string;
    HEVY_API_KEY?: string;
    BUCKET?: R2Bucket;
  }
}
