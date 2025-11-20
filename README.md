# HA Countdown Timer App

A React + Vite application that displays a configurable countdown timer, triggered either by a UI button or a Zigbee button connected to Home Assistant.

## Features

- Configurable countdown duration (in seconds)
- Start, Stop, and Reset controls
- Physical Zigbee button integration via Home Assistant
- Sound and browser notification when countdown reaches zero
- Mobile-optimized full-screen UI
- Built with Tailwind CSS 4

## Setup

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

## Usage

- Set the countdown duration using the number input (in seconds)
- Click "Start" to begin the countdown
- Click "Stop" to pause the countdown
- Click "Reset" to return to the configured duration
- Physical Zigbee button controls:
  - Single press: Reset and start the countdown
  - Double press: Stop the countdown
- When the countdown reaches zero, a sound plays and a browser notification appears

## Requirements

- Node.js and npm
- Home Assistant instance with long-lived access token
- Zigbee button entity configured in Home Assistant
