export interface JsConfig {
  remote:
    | {
        url: string;
        strategy:
          | "beforeInteractive"
          | "afterInteractive"
          | "lazyOnload"
          | undefined;
      }[]
    | undefined;
  inline: string[] | undefined;
}
