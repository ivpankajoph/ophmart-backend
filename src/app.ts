import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

// Security and middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow any local dev origin, or matching frontend URL
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-id']
  })
);

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount all API routes
app.use('/api', routes);

// Swagger / OpenAPI documentation endpoint at /api/docs
app.get('/api/docs', (_req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OPHMNART Luxury API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #faf9f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .topbar { display: none; }
    .swagger-ui .info { margin: 30px 0; }
    .swagger-ui .info .title { font-family: serif; letter-spacing: 0.05em; font-size: 2.2rem; color: #111; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '/api/docs/spec.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>
  `);
});

// Swagger Specification JSON
app.get('/api/docs/spec.json', (_req: Request, res: Response) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'OPHMNART Luxury E-Commerce Platform REST API',
      version: '1.0.0',
      description: 'Comprehensive REST API documentation for OPHMNART luxury fashion commerce platform.'
    },
    servers: [
      { url: 'http://localhost:5000/api', description: 'Development server' }
    ],
    paths: {
      '/auth/register': { post: { summary: 'Register a new customer account' } },
      '/auth/login': { post: { summary: 'Login customer or admin user' } },
      '/auth/me': { get: { summary: 'Get current authenticated user' } },
      '/products': { get: { summary: 'Filter and paginate products' } },
      '/products/{slug}': { get: { summary: 'Get product by slug with recommendations' } },
      '/products/search/overlay': { get: { summary: 'Search overlay suggestions & trending' } },
      '/categories': { get: { summary: 'Get nested hierarchical category tree' } },
      '/cart': { get: { summary: 'Get shopping bag' } },
      '/cart/items': { post: { summary: 'Add item to shopping bag' } },
      '/orders': { post: { summary: 'Create & checkout order' }, get: { summary: 'Get user orders' } },
      '/wishlist': { get: { summary: 'Get wishlist' } },
      '/wishlist/toggle': { post: { summary: 'Toggle wishlist product' } },
      '/reviews': { get: { summary: 'Get product reviews' }, post: { summary: 'Submit verified review' } },
      '/coupons/validate': { post: { summary: 'Validate discount coupon' } },
      '/admin/dashboard': { get: { summary: 'Admin metrics and revenue charts' } }
    }
  });
});

// 404 Route handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
    code: 'NOT_FOUND'
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
