#!/bin/bash

# Function to read .env file and export variables
export_env() {
  while IFS='=' read -r key value
  do
    # Ignore comments and empty lines
    if [[ $key && ${key:0:1} != '#' ]]; then
      # Remove surrounding quotes if present
      value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//')
      # Export the variable
      export "$key=$value"
    fi
  done < .env.e2e
}

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null
then
    echo "Docker Compose could not be found. Please install it and make sure it's in your PATH."
    echo "Visit https://docs.docker.com/compose/install/ for installation instructions."
    exit 1
fi

# Load environment variables from .env file
export_env

# Run Docker Compose with the e2e-test profile
docker compose --profile e2e-test build
docker compose --profile e2e-test up --abort-on-container-exit --exit-code-from e2e-test-runner