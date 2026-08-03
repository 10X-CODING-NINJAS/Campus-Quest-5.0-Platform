#!/bin/bash
# Campus Quest 5.0 - Local Server Environment Setup
# This script installs the required compilers/runtimes for the Judge Sandbox
# and starts the Fastify Backend locally.

set -e

echo "========================================================"
echo " Campus Quest 5.0 - Local Server & Judge Setup"
echo "========================================================"

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo "Detected OS: $MACHINE"

# 1. Install Compilers & Runtimes
echo "--- Installing Compilers & Runtimes ---"
if [ "$MACHINE" == "Mac" ]; then
    # Ensure Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi

    echo "Installing GCC, Python, and Java via Homebrew..."
    brew install gcc python openjdk
    # Symlink java if necessary
    sudo ln -sfn $(brew --prefix)/opt/openjdk/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk.jdk || true

elif [ "$MACHINE" == "Linux" ]; then
    echo "Installing GCC, Python, and Java via APT..."
    sudo apt-get update
    sudo apt-get install -y build-essential python3 openjdk-17-jdk curl
else
    echo "Unsupported OS for automated install. Please install gcc, g++, python3, and java manually."
    exit 1
fi

echo "--- Verifying Installations ---"
gcc --version | head -n 1
python3 --version
java -version

# 2. Setup Node dependencies
echo "--- Installing Node Dependencies ---"
npm install

# 3. Setup Database (Assuming PostgreSQL is running locally)
echo "--- Pushing Database Schema ---"
cd apps/backend
npx drizzle-kit push

# 4. Start the Backend Server
echo "========================================================"
echo " Setup Complete! Starting the Campus Quest Backend..."
echo " The Judge Sandbox is now fully operational locally."
echo "========================================================"
cd ../../
npx turbo run dev --filter=@campus-quest/backend
