# Fern Search Widget

A standalone, distributable search widget that provides Algolia search and Ask AI functionality outside of Fern documentation sites.

## Features

- 🔍 **Algolia Search**: Full-text search through your documentation
- 🤖 **Ask AI**: AI-powered chat interface for documentation questions
- 🎨 **Customizable**: Configurable appearance and behavior
- 📱 **Responsive**: Works on desktop and mobile
- 🚀 **Standalone**: Deploy anywhere, embed on any website

## Quick Start

### 1. Development

```bash
cd packages/search-widget
pnpm install
pnpm dev
```

### 2. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_ALGOLIA_APP_ID=your_algolia_app_id
NEXT_PUBLIC_ALGOLIA_API_KEY=your_algolia_api_key
NEXT_PUBLIC_ALGOLIA_INDEX_NAME=your_algolia_index
OPENAI_API_KEY=your_openai_api_key
```

### 3. Usage

#### As a React Component

```tsx
import { SearchWidget } from '@fern-platform/search-widget';

function MyApp() {
  return (
    <SearchWidget
      domain="your-domain.com"
      apiEndpoint="/api/chat"
      algolia={{
        appId: "your_algolia_app_id",
        apiKey: "your_algolia_api_key",
        indexName: "your_index_name",
      }}
      systemPrompt="You are a helpful AI assistant."
      buttonProps={{
        variant: "default",
        size: "default",
      }}
    />
  );
}
```

#### As a Bundled Widget

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://your-deployed-widget.com/widget.js"></script>
</head>
<body>
  <script>
    FernSearchWidget.init({
      domain: "your-domain.com",
      apiEndpoint: "https://your-api.com/api/chat",
      algolia: {
        appId: "your_algolia_app_id",
        apiKey: "your_algolia_api_key",
        indexName: "your_index_name",
      }
    });
  </script>
</body>
</html>
```

## Configuration

### SearchWidget Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `domain` | `string` | ✅ | Your domain for analytics and context |
| `apiEndpoint` | `string` | | Chat API endpoint (defaults to `/api/chat`) |
| `algolia` | `AlgoliaConfig` | ✅ | Algolia search configuration |
| `systemPrompt` | `string` | | Custom system prompt for AI |
| `fetchFacets` | `function` | | Custom facets fetcher |
| `initialFilters` | `object` | | Initial search filters |
| `buttonProps` | `SearchButtonProps` | | Search button customization |

### Algolia Config

```tsx
{
  appId: string;      // Algolia Application ID
  apiKey: string;     // Algolia Search API Key (public)
  indexName: string;  // Algolia Index Name
}
```

## Deployment

### Option 1: Full Next.js App

Deploy the entire app to Vercel, Netlify, or any platform that supports Next.js.

```bash
pnpm build
pnpm start
```

### Option 2: Widget Bundle

Build and distribute just the widget:

```bash
pnpm build:widget
```

This creates `dist/widget.js` that can be embedded anywhere.

### Option 3: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## API Routes

### POST /api/chat

The chat endpoint accepts:

```json
{
  "messages": [
    {
      "id": "1",
      "role": "user",
      "content": "What is Fern?"
    }
  ],
  "domain": "your-domain.com",
  "conversationId": "conversation-123",
  "queryId": "query-456",
  "modelId": "claude-3.5",
  "systemPrompt": "You are a helpful assistant."
}
```

Returns a streaming response using Vercel AI SDK.

## Customization

### Button Variants

```tsx
<SearchWidget
  buttonProps={{
    variant: "default" | "dark" | "minimal",
    size: "sm" | "default" | "lg"
  }}
/>
```

### Custom Styling

The widget uses Tailwind CSS. Override styles by providing custom CSS:

```css
.search-widget-button {
  /* Your custom styles */
}
```

## Analytics

The widget automatically tracks usage metrics that can be viewed in the Fern dashboard.

## Development

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/chat/          # Chat API endpoint
│   ├── page.tsx           # Demo page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── SearchWidget.tsx  # Main widget
│   ├── SearchButton.tsx  # Floating button
│   ├── SearchModal.tsx   # Search interface
│   └── ChatModal.tsx     # AI chat interface
└── lib/                   # Utilities
```

### Building

- `pnpm dev` - Start development server
- `pnpm build` - Build Next.js app
- `pnpm build:widget` - Build widget bundle
- `pnpm typecheck` - Type checking
- `pnpm lint` - Linting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request

## License

This project is licensed under the MIT License.