#!/bin/bash

# Docker build script that loads from .env file if available
# Usage: ./docker-build.sh [additional docker build args...]
# Example: ./docker-build.sh -t ha-timer-game-app:latest

set -e

# Array to store build arguments
BUILD_ARGS=()

# Check if .env file exists and load VITE_* variables
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  
  # Source the .env file
  set -a
  source ./.env
  set +a
  
  # Add VITE_* variables as build args if they exist
  if [ -n "${VITE_HASS_HOST:-}" ]; then
    BUILD_ARGS+=(--build-arg "VITE_HASS_HOST=$VITE_HASS_HOST")
    echo "  Found: VITE_HASS_HOST"
  fi
  if [ -n "${VITE_HASS_ACCESS_TOKEN:-}" ]; then
    BUILD_ARGS+=(--build-arg "VITE_HASS_ACCESS_TOKEN=$VITE_HASS_ACCESS_TOKEN")
    echo "  Found: VITE_HASS_ACCESS_TOKEN"
  fi
  if [ -n "${VITE_HASS_BUTTON_ENTITY:-}" ]; then
    BUILD_ARGS+=(--build-arg "VITE_HASS_BUTTON_ENTITY=$VITE_HASS_BUTTON_ENTITY")
    echo "  Found: VITE_HASS_BUTTON_ENTITY"
  fi
else
  echo "No .env file found, using environment variables or build args only"
  
  # Check for environment variables that might be set
  if [ -n "${VITE_HASS_HOST:-}" ]; then
    BUILD_ARGS+=(--build-arg "VITE_HASS_HOST=$VITE_HASS_HOST")
    echo "  Using VITE_HASS_HOST from environment"
  fi
  if [ -n "${VITE_HASS_ACCESS_TOKEN:-}" ]; then
    BUILD_ARGS+=(--build-arg "VITE_HASS_ACCESS_TOKEN=$VITE_HASS_ACCESS_TOKEN")
    echo "  Using VITE_HASS_ACCESS_TOKEN from environment"
  fi
  if [ -n "${VITE_HASS_BUTTON_ENTITY:-}" ]; then
    BUILD_ARGS+=(--build-arg "VITE_HASS_BUTTON_ENTITY=$VITE_HASS_BUTTON_ENTITY")
    echo "  Using VITE_HASS_BUTTON_ENTITY from environment"
  fi
fi

# Build the Docker image with all arguments
echo "Building Docker image..."
docker build "${BUILD_ARGS[@]}" "$@"

