# 1. Use a lightweight Node.js image
FROM node:18-alpine

# 2. Create working directory
WORKDIR /app

# 3. Copy only the dependency list and install them
COPY package*.json ./
RUN npm install --only=prod

# 4. Copy the rest of your app
COPY . .

# 5. Set the default command when the container runs
CMD ["node", "checkSubscriptions.js"]
