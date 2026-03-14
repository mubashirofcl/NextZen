# Step 1: Use a lightweight Node image
FROM node:20-alpine

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy package files first to leverage Docker cache
# This speeds up future builds if dependencies haven't changed
COPY package*.json ./

# Step 4: Install only production dependencies
RUN npm install --omit=dev

# Step 5: Copy the rest of your application code
COPY . .

# Step 6: Expose the port your app runs on (e.g., 5000)
EXPOSE 5000

# Step 7: Define the command to run your app
CMD ["npm", "start"]