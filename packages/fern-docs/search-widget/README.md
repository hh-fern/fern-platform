# Fern Search Widget

A standalone, distributable search widget that connects directly to Fern's existing Ask AI endpoint (`/api/fern-docs/search/v2/chat`).

## Features

- 🤖 **Ask AI**: AI-powered chat using FDR's existing chat endpoint
- 🎨 **Customizable**: Configurable appearance and behavior
- 📱 **Responsive**: Works on desktop and mobile
- 🚀 **Standalone**: Deploy anywhere, embed on any website
- 🔌 **No Backend Required**: Connects directly to existing Fern documentation AI

## Quick Start

### 1. Development

```bash
cd packages/search-widget
pnpm install
pnpm dev  # Runs on port 3001
```

### 2. No Environment Variables Needed!

This widget connects directly to the existing FDR chat endpoint, so no API keys or environment variables are required.

### 3. Usage

#### As a React Component

```tsx
import { SearchWidget } from "@fern-platform/search-widget";

function MyApp() {
  return (
    <SearchWidget
      domain="docs.buildwithfern.com" // Your Fern docs domain
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
        domain: "docs.buildwithfern.com", // Your Fern docs domain
      });
    </script>
  </body>
</html>
```

## Configuration

### SearchWidget Props

| Prop          | Type                | Required | Description                                            |
| ------------- | ------------------- | -------- | ------------------------------------------------------ |
| `domain`      | `string`            | ✅       | Your Fern docs domain (e.g., "docs.buildwithfern.com") |
| `buttonProps` | `SearchButtonProps` |          | Search button customization                            |

### Button Variants

```tsx
<SearchWidget
  domain="your-domain.com"
  buttonProps={{
    variant: "default" | "dark" | "minimal",
    size: "sm" | "default" | "lg",
  }}
/>
```

## How It Works

1. **Widget Initialization**: Creates a floating search button
2. **User Interaction**: Clicking the button opens the Ask AI modal
3. **Direct Connection**: Chat modal connects directly to `https://{domain}/api/fern-docs/search/v2/chat`
4. **Streaming Responses**: Uses Vercel AI SDK to handle streaming AI responses

## Requirements

- Your Fern documentation must have Ask AI enabled
- Domain must be accessible from the widget's deployment location
- CORS may need to be configured for cross-origin requests

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

## API Integration

The widget automatically formats requests to match the existing FDR chat endpoint:

```json
{
  "messages": [...],
  "url": "current_page_url",
  "conversationId": "uuid",
  "queryId": "uuid",
  "filters": [],
  "documentUrls": [],
  "source": "WIDGET"
}
```

## Customization

### Custom Styling

Override default styles:

```css
.search-widget-button {
  /* Your custom button styles */
}

.search-widget-modal {
  /* Your custom modal styles */
}
```

### Button Position

The button is positioned fixed in the bottom-right by default. Override with CSS:

```css
.search-widget-button {
  bottom: 20px;
  right: 20px;
  /* Or any other position */
}
```

## Development

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Demo page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── SearchWidget.tsx  # Main widget
│   ├── SearchButton.tsx  # Floating button
│   ├── SearchModal.tsx   # Search interface (placeholder)
│   └── ChatModal.tsx     # AI chat interface
└── constants.ts           # App constants
```

### Building

- `pnpm dev` - Start development server
- `pnpm build` - Build Next.js app
- `pnpm build:widget` - Build widget bundle
- `pnpm typecheck` - Type checking
- `pnpm lint` - Linting

## Troubleshooting

### Common Issues

1. **Chat not working**: Ensure Ask AI is enabled for your domain
2. **CORS errors**: Check if your domain allows cross-origin requests
3. **Button not appearing**: Check for CSS conflicts with `z-index`

### Testing Connection

You can test if your domain's Ask AI is working by making a direct request:

```bash
curl -X POST "https://your-domain.com/api/fern-docs/search/v2/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "conversationId": "test",
    "queryId": "test"
  }'
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request

## License

This project is licensed under the MIT License.
