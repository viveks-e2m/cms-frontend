# # Build stage
# FROM node:18-alpine as build

# WORKDIR /app

# # Copy package files
# COPY package*.json ./

# # Install dependencies
# RUN npm ci --only=production

# # Copy source code
# COPY . .

# # Build the app
# RUN npm run build

# # Production stage
# FROM nginx:alpine

# # Copy built app to nginx
# COPY --from=build /app/build /usr/share/nginx/html

# # Copy nginx configuration
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# # Expose port
# EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]




################################

# FROM node:18-alpine

# WORKDIR /app

# # Copy package files
# COPY package*.json ./

# # Install ALL dependencies (including dev)
# RUN npm ci --silent

# # Copy source code
# COPY . .

# EXPOSE 3000

# # Development server
# CMD ["npm", "start"]



FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --silent

# Copy source code
COPY . .

# Build the production app
RUN npm run build

# Install a lightweight static file server
RUN npm install -g serve

EXPOSE 3000

# Serve the built app
CMD ["serve", "-s", "build", "-l", "3000"]
