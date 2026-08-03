FROM node:20-slim

# Install C, C++, Python, Java compilers for the Judge Sandbox
RUN apt-get update && apt-get install -y \
    build-essential \
    g++ \
    gcc \
    python3 \
    default-jdk \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace package definitions
COPY package*.json tsconfig.base.json turbo.json ./
COPY packages/ ./packages/
COPY apps/backend/ ./apps/backend/

# Install dependencies and build workspace dependencies & backend
RUN npm install
RUN npx turbo run build --filter=@campus-quest/backend...

WORKDIR /app/apps/backend

EXPOSE 3001

CMD ["npm", "run", "start"]
