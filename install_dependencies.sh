# Install Backend Dependencies
echo "Installing Backend Dependencies..."
npm install express mssql dotenv cors
npm install --save-dev typescript @types/express @types/node @types/mssql ts-node nodemon


echo "✅ Installation Complete. Run 'npm run dev' to start the API."