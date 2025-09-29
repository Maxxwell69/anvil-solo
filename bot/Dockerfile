# Use an official Node.js runtime as a parent image (LTS version)
FROM node:20-alpine AS builder

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install app dependencies
# Use npm ci for cleaner installs if package-lock.json is reliable
RUN npm ci --only=production

# Copy the rest of the application source code
COPY . .

# Build TypeScript code (assuming 'npm run build' compiles TS to ./build)
# If your build script differs, adjust this line
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy only necessary files from the builder stage
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./build
COPY --from=builder /usr/src/app/dist/config.json ./build/config.json


EXPOSE 8080

CMD ["node", "build/main.js"]

