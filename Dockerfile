# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm i
# Copy source code
COPY . .

RUN npm run build

CMD ["npm", "run", "start"]
