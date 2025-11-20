# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install prisma CLI explicitly to ensure it's available
RUN npm install -D prisma

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 8000

# Start the server using tsx
CMD ["npx", "tsx", "src/index.ts"]
