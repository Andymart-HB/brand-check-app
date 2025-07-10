# Brand Check Service Environment Configuration

# Server Configuration
PORT=3000
NODE_ENV=development

# Document Configuration
MARKDOWN_FILE=data/brand-check-app-overview.md

# Authentication
EDIT_TOKEN=dev-edit-token
JWT_SECRET=dev-secret-key

# Logging
LOG_LEVEL=info

# CORS (for production)
# ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Rate Limiting
# RATE_LIMIT_WINDOW_MS=900000
# RATE_LIMIT_MAX_REQUESTS=100

# Development Settings
# ENABLE_CORS=true
# ENABLE_RATE_LIMITING=true

# Production Settings (uncomment for production)
# NODE_ENV=production
# LOG_LEVEL=warn
# EDIT_TOKEN=your-secure-production-token-here
# JWT_SECRET=your-secure-jwt-secret-here