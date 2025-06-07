export type SemanticColor = "error" | "danger" | "success" | "warning" | "info" | "none" | "primary";
export type GrayscaleColor = "gray" | "mauve" | "slate" | "sage" | "olive" | "sand";
export type RadixColor = "tomato" | "red" | "ruby" | "crimson" | "pink" | "plum" | "purple" | "violet" | "iris" | "indigo" | "blue" | "cyan" | "teal" | "jade" | "green" | "grass" | "bronze" | "gold" | "brown" | "orange" | "amber" | "yellow" | "lime" | "mint" | "sky";
export type UIColor = RadixColor | "gray" | "accent";
export declare const GrayscaleColor: Record<Capitalize<GrayscaleColor>, GrayscaleColor>;
export declare const RadixColor: Record<Capitalize<RadixColor>, RadixColor>;
export declare const RadixColorOrder: readonly [RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor];
export declare const UIColor: Record<Capitalize<UIColor>, UIColor>;
export declare const UIColorOrder: readonly ["gray", "accent", RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor, RadixColor];
export declare const SemanticColor: Record<Capitalize<SemanticColor>, SemanticColor>;
export declare const SemanticColorOrder: readonly [SemanticColor, SemanticColor, SemanticColor, SemanticColor, SemanticColor, SemanticColor, SemanticColor];
export declare const SemanticColorMap: Record<SemanticColor, UIColor>;
//# sourceMappingURL=colors.d.ts.map