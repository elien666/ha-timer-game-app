#!/usr/bin/env node

/**
 * Runtime configuration injection script
 * Injects environment variables into the built Vite app at container startup
 */

const fs = require('fs');
const path = require('path');

const distDir = '/usr/share/nginx/html';
const indexPath = path.join(distDir, 'index.html');

// Read environment variables
const config = {
  VITE_HASS_HOST: process.env.VITE_HASS_HOST || '',
  VITE_HASS_ACCESS_TOKEN: process.env.VITE_HASS_ACCESS_TOKEN || '',
  VITE_HASS_BUTTON_ENTITY: process.env.VITE_HASS_BUTTON_ENTITY || '',
};

// Create a config script that will be injected into the HTML
const configScript = `
<script>
  window.__HA_CONFIG__ = ${JSON.stringify(config)};
</script>
`;

try {
  // Read the index.html file
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // Remove any existing config script
  html = html.replace(/<script>[\s\S]*?window\.__HA_CONFIG__[\s\S]*?<\/script>/g, '');
  
  // Inject the config script before the closing </head> tag, or before </body> if no </head>
  if (html.includes('</head>')) {
    html = html.replace('</head>', `${configScript}</head>`);
  } else if (html.includes('</body>')) {
    html = html.replace('</body>', `${configScript}</body>`);
  } else {
    // If neither exists, append to the end
    html += configScript;
  }
  
  // Write back the modified HTML
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('Configuration injected successfully');
} catch (error) {
  console.error('Error injecting configuration:', error);
  process.exit(1);
}

