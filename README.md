# BixbyBot

BixbyBot is a modern chat widget solution with an admin dashboard for managing conversations and settings. The project is structured as a monorepo containing two main packages:

- `packages/admin`: The admin dashboard built with Vue 3 and Vuetify
- `packages/widget`: A lightweight, customizable chat widget that can be embedded in any website

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

## Project Structure

```
bixbybot/
├── packages/
│   ├── admin/     # Admin dashboard
│   └── widget/    # Embeddable chat widget
├── package.json
└── README.md
```

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bixbybot.git
   cd bixbybot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development

### Running the Admin Dashboard

```bash
npm run dev:admin
```

The admin dashboard will be available at `http://localhost:5173`

### Running the Widget Development Server

```bash
npm run dev:widget
```

The widget demo page will be available at `http://localhost:5174`

## Building for Production

To build both the admin dashboard and widget:

```bash
npm run build
```

This will create:
- Admin dashboard build in `packages/admin/dist/`
- Widget build in `packages/widget/dist/`

## Deployment

### Admin Dashboard

The admin dashboard is configured to deploy to Netlify. The main `netlify.toml` file contains all necessary configuration.

1. Connect your repository to Netlify
2. Configure the following build settings:
   - Build command: `npm run build`
   - Publish directory: `packages/admin/dist`
   - Base directory: `/`

Environment variables needed:
- `VITE_API_URL`: Your API endpoint URL

### Widget

The widget is deployed separately and has its own `netlify.toml` configuration in `packages/widget/`.

1. Create a new site in Netlify for the widget
2. Configure the following build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory: `packages/widget`

The widget will be available at:
```
https://your-widget-url.netlify.app/bixby-widget.js
```

## Using the Widget

To add the chat widget to your website, add the following script tag to your HTML:

```html
<script 
  src="https://your-widget-url.netlify.app/bixby-widget.js"
  data-client-id="YOUR_CLIENT_ID">
</script>
```

Replace `YOUR_CLIENT_ID` with your unique client identifier provided by the BixbyBot admin dashboard.

The widget will automatically initialize and appear in the bottom-right corner of your website. The client ID is used to:
- Load client-specific configurations
- Track conversations and analytics
- Apply custom styling and branding
- Route messages to the correct support team

### Widget Features
- Automatic initialization
- Client-specific configurations
- Customizable styling
- Real-time chat functionality
- Message history persistence
- Responsive design
- Cross-browser compatibility

## Development Notes

### Admin Dashboard
- Built with Vue 3 and Vuetify
- Uses Vue Router for navigation
- Includes dashboard, chat, profile, and settings pages
- Optimized builds with chunk splitting

### Widget
- Vanilla JavaScript with no dependencies
- Self-initializing when loaded
- Customizable styling
- Lightweight and performance-optimized
- Built as IIFE for maximum compatibility
- Minified and compressed for production
- Client-specific configuration support

## Security

Both the admin dashboard and widget include security headers and CSP configurations in their respective `netlify.toml` files. Make sure to review and adjust these settings based on your specific requirements.

## License

[Your License Here]