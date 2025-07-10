# Use official Node.js image
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy package.json and install deps
COPY package*.json ./
RUN npm install

# Copy the rest of your backend code
COPY . .

# Expose the port your app uses (match index.js)
EXPOSE 4000

# Start the server
CMD ["node", "index.js"]