[![Build and Push Docker Image](https://github.com/elien666/ha-timer-game-app/actions/workflows/docker-build.yml/badge.svg)](https://github.com/elien666/ha-timer-game-app/actions/workflows/docker-build.yml)

# HA Countdown Timer App

A React + Vite application that displays a configurable countdown timer, triggered either by a UI button or a Zigbee button connected to Home Assistant.

## Features

- Configurable countdown duration (in seconds)
- Start, Stop, and Reset controls
- Physical Zigbee button integration via Home Assistant
- Sound and browser notification when countdown reaches zero
- Mobile-optimized full-screen UI
- Built with Tailwind CSS 4

## Usage

- Set the countdown duration using the number input (in seconds)
- Click "Start" to begin the countdown
- Click "Stop" to pause the countdown
- Click "Reset" to return to the configured duration
- Physical Zigbee button controls:
  - Single press: Reset and start the countdown
  - Double press: Stop the countdown
- When the countdown reaches zero, a sound plays and a browser notification appears

## Docker Deployment

### Using docker-compose (Recommended)

docker-compose automatically reads `.env` files and uses pre-built images from GitHub Container Registry.

Create a `docker-compose.yml` file:

```yaml
services:
  ha-timer-game-app:
    image: ghcr.io/elien666/ha-timer-game-app:latest
    ports:
      - "8080:80"
    environment:
      # Runtime environment variables (for config injection)
      # These are automatically loaded from .env file if present
      - VITE_HASS_HOST=${VITE_HASS_HOST:-}
      - VITE_HASS_ACCESS_TOKEN=${VITE_HASS_ACCESS_TOKEN:-}
      - VITE_HASS_BUTTON_ENTITY=${VITE_HASS_BUTTON_ENTITY:-}
    restart: unless-stopped
```

Then run:

```bash
docker-compose up -d
```

The app will be available at `http://localhost:8080`.

### Running the Container (Alternative to docker-compose)

Run with runtime environment variables (no rebuild needed):
```bash
docker run -d \
  -p 8080:80 \
  -e VITE_HASS_HOST=https://your-home-assistant-instance.local \
  -e VITE_HASS_ACCESS_TOKEN=your-long-lived-access-token \
  -e VITE_HASS_BUTTON_ENTITY=button.your_zigbee_button_entity \
  ghcr.io/elien666/ha-timer-game-app:latest
```

**Note**: Replace `elien666` with your GitHub username/organization. The Docker image supports runtime configuration via environment variables, so you can use the same image in different environments without rebuilding.

## Local Development

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your Home Assistant credentials:
   ```env
   VITE_HASS_HOST=https://your-home-assistant-instance.local
   VITE_HASS_ACCESS_TOKEN=your-long-lived-access-token
   VITE_HASS_BUTTON_ENTITY=button.your_zigbee_button_entity
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

### Building the Docker Image

**Option 1: Using the build script (loads from .env file)**

The `docker-build.sh` script automatically loads environment variables from a `.env` file if it exists:

```bash
./docker-build.sh -t ha-timer-game-app .
```

The script will:
- Read `VITE_*` variables from `.env` if present
- Use environment variables if set (takes precedence over .env)
- Pass all variables as build arguments to Docker

**Option 2: Manual build with build arguments**

Build with build-time environment variables directly:
```bash
docker build \
  --build-arg VITE_HASS_HOST=https://your-home-assistant-instance.local \
  --build-arg VITE_HASS_ACCESS_TOKEN=your-long-lived-access-token \
  --build-arg VITE_HASS_BUTTON_ENTITY=button.your_zigbee_button_entity \
  -t ha-timer-game-app .
```

## Requirements

- Node.js and npm
- Home Assistant instance with long-lived access token
- Zigbee button entity configured in Home Assistant
