# @fern-api/syntax-highlighter

Shared syntax highlighting utilities using Shiki, used by both `fern-docs` and `fern-dashboard`.

## Features

- 🎨 Syntax highlighting powered by Shiki
- 🌓 Light and dark theme support
- 🔌 Extensible language support (includes BAML and Jinja)
- 🎯 Template variable detection and highlighting
- ⚛️ React hooks for easy integration
- 🚀 Configurable memoization for performance

## Installation

This package is part of the Fern Platform monorepo and is intended for internal use.

```bash
pnpm add @fern-api/syntax-highlighter
```

## Usage

### Basic Usage

```tsx
import { useHighlightTokens, createRawTokens } from "@fern-api/syntax-highlighter";

function CodeBlock({ code, language }) {
  const highlightTokens = useHighlightTokens();
  const [tokens, setTokens] = useState(() => createRawTokens(code, language));

  useEffect(() => {
    highlightTokens(code, language, setTokens);
  }, [code, language, highlightTokens]);

  return <HastToJSX hast={tokens.hast} />;
}
```

### With Configuration Options

```tsx
import { useHighlightTokens } from "@fern-api/syntax-highlighter";

function CodeBlock({ code, language }) {
  const highlightTokens = useHighlightTokens({
    enableMemoization: true,
    templateVariables: new Set(["API_KEY", "USER_ID"])
  });

  // ... rest of implementation
}
```

### Direct Highlighter Access

```tsx
import { getHighlighterInstance, highlightTokens } from "@fern-api/syntax-highlighter";

async function highlightCode(code: string, lang: string) {
  const highlighter = await getHighlighterInstance()(lang);
  return highlightTokens(highlighter, code, lang);
}
```

## API

### `getHighlighterInstance(options?)`

Returns a function that gets the Shiki highlighter instance for a given language.

**Options:**
- `enableMemoization?: boolean` - Enable/disable memoization (default: `true`)
- `additionalLanguages?: Record<string, () => Promise<LanguageRegistration>>` - Additional language definitions

### `useHighlightTokens(options?)`

React hook that returns a callback for highlighting code asynchronously.

### `useHighlighter(lang, options?)`

React hook that returns the Shiki highlighter instance for a specific language.

### `highlightTokens(highlighter, code, lang, templateVariables?)`

Synchronously highlights code using a Shiki highlighter instance.

### `parseLang(lang)`

Normalizes language names (e.g., "golang" → "go", "curl" → "bash").

### `trimCode(code)`

Removes leading and trailing newlines from code.

### `createRawTokens(code, lang)`

Creates unhighlighted tokens as a fallback.

## Supported Languages

Includes all Shiki bundled languages plus:
- **BAML** - BoundaryML configuration language
- **Jinja** - Jinja templating language

## Theme Configuration

The package uses:
- Light theme: `min-light` (default), `github-light` (for diff)
- Dark theme: `material-theme-darker`

## Integration Examples

### fern-docs/components

```tsx
import { useHighlightTokens } from "@fern-api/syntax-highlighter";

// Configured with environment-specific memoization
const highlightTokens = useHighlightTokens({
  enableMemoization: !isLocal() && !isSelfHosted(),
  additionalLanguages: customLanguages
});
```

### fern-dashboard

```tsx
import { useHighlightTokens } from "@fern-api/syntax-highlighter";

// Always uses memoization for performance
const highlightTokens = useHighlightTokens({
  enableMemoization: true
});
```

## Development

```bash
# Compile
pnpm --filter=@fern-api/syntax-highlighter compile

# Test
pnpm --filter=@fern-api/syntax-highlighter test

# Lint
pnpm --filter=@fern-api/syntax-highlighter lint:eslint
```

## License

Private package for internal Fern Platform use.
