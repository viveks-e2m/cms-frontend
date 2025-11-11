FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm i

# Copy source code
COPY . .

# Build the production app
RUN npm run build

# Install a lightweight static file server
RUN npm install -g serve

EXPOSE 3000

# Serve the built app
CMD ["serve", "-s", "build", "-l", "3000"]
