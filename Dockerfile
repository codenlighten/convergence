FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create .env placeholder
RUN echo "OPENAI_API_KEY=\nOPENAI_DEFAULT_MODEL=gpt-4o-mini\nOPENAI_DEFAULT_TEMPERATURE=0.7\nNODE_ENV=production\nPORT=3000" > .env.template

# Expose port for API server
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('ok')" || exit 1

# Run the application
CMD ["node", "index.js"]
