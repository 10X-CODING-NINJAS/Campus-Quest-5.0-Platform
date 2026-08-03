FROM node:20-slim

# Install compilers and tools for the Judge Worker
RUN apt-get update && apt-get install -y \
    python3 \
    gcc \
    g++ \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy the root package manager files and base config
COPY package.json package-lock.json turbo.json tsconfig.base.json ./

# Copy packages and apps (since it's a monorepo, we need shared code)
COPY packages ./packages
COPY apps/backend ./apps/backend

# Install dependencies and build
RUN npm install
# Generate Prisma client (if any)
RUN npx turbo run db:generate --filter=@campus-quest/backend || true
RUN npx turbo run build --filter=@campus-quest/backend

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "run", "start", "--prefix", "apps/backend"]
