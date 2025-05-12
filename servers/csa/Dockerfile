FROM node:20.18-alpine3.20

# Install dependencies
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@v9.4.0

WORKDIR /app

COPY . /app

RUN pnpm install
RUN pnpm build

# Create fixtures directory
RUN mkdir -p /app/fixtures

# Set the working directory to the fixtures directory
WORKDIR /app/fixtures

# Use CMD to allow passing arguments
ENTRYPOINT ["pnpm", "audit"]
CMD []
