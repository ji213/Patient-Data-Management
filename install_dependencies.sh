#!/bin/bash

# 1. Install Backend Dependencies
echo "--- Setting up Backend ---"
cd backend
npm install express mssql dotenv cors
npm install --save-dev typescript ts-node @types/express @types/mssql @types/node @types/cors
cd .. # Move back to root

# 2. Install Frontend Dependencies
echo "--- Setting up Frontend ---"
cd frontend
npm install
npm install axios lucide-react
cd .. # Move back to root

echo "Setup Complete! You can now run 'npm run dev' in both folders."