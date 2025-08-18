# Use official Node.js image
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy package.json and install deps
COPY package*.json ./
RUN npm ci
#    IMPORTANT: ensure .dockerignore does NOT exclude the prisma/ dir
COPY prisma ./prisma

# 3) Generate Prisma Client (point to schema explicitly)
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy the rest of your backend code
COPY . .

# Expose the port your app uses (match index.js)
EXPOSE 4000

# Start the server
CMD ["node", "index.js"]