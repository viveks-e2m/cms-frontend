# CMS Frontend

A professional ReactJS frontend application for the CMS project with authentication, responsive design, and Docker support.

## Features

- **Authentication System**: Login/logout with JWT token management
- **Professional UI**: Clean, corporate design with navy blue and gold theme
- **Responsive Design**: Mobile-first approach with modern CSS Grid and Flexbox
- **Docker Support**: Containerized deployment with Nginx
- **Modern React**: Functional components with hooks
- **API Integration**: Axios-based API client with interceptors
- **Protected Routes**: Route-based authentication guards

## Tech Stack

- React 18
- React Router DOM 6
- Axios for API calls
- CSS3 with CSS Variables
- Docker & Nginx
- Inter font family

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Backend API running

### Development Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment configuration:**
   ```bash
   cp .env.example .env
   # Edit .env with your backend API URL
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

### Docker Deployment

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - API proxy: http://localhost:3000/api

## Project Structure

```
src/
├── components/
│   ├── Auth/
│   │   ├── LoginForm/
│   │   ├── LogoutButton/
│   │   └── ProtectedRoute/
│   ├── Layout/
│   │   └── Header/
│   └── UI/
│       └── LoadingSpinner/
├── pages/
│   ├── Login/
│   └── Dashboard/
├── hooks/
│   └── useAuth.js
├── utils/
│   └── api.js
└── styles/
    ├── index.css
    └── App.css
```

## API Integration

The frontend expects the following backend endpoints:

- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Expected API Response Format

**Login Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

## Design System

### Color Palette
- Primary Navy: `#001F3F`
- White: `#FFFFFF`
- Light Gray: `#F5F5F5`
- Medium Gray: `#E0E0E0`
- Dark Gray: `#A9A9A9`
- Gold Accent: `#D4AF37`

### Typography
- Font Family: Inter
- Weights: 300, 400, 500, 600, 700

## Development Guidelines

- Use functional components with hooks
- Follow component-centric folder structure
- Implement proper error handling
- Use CSS variables for theming
- Write clean, readable code
- Validate props with PropTypes (if needed)

## Docker Configuration

The application uses multi-stage Docker build:
1. **Build stage**: Compiles React app
2. **Production stage**: Serves with Nginx

Nginx configuration includes:
- Static file serving
- API proxy to backend
- SPA routing support

## Contributing

1. Follow the established code style
2. Use meaningful commit messages
3. Test your changes thoroughly
4. Update documentation as needed

## License

This project is proprietary and confidential.