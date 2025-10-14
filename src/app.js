const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const routes = require("./routes/index");
const errorHandler = require("./middleware/errorHandler");
const { swaggerUi, swaggerDocs } = require("./config/swagger");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Home route
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>JobBoost API Server</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 {
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
          }
          .links {
            margin: 20px 0;
          }
          .links a {
            display: inline-block;
            margin-right: 15px;
            padding: 8px 15px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 4px;
          }
          .links a:hover {
            background-color: #45a049;
          }
          code {
            background-color: #f4f4f4;
            padding: 2px 5px;
            border-radius: 3px;
          }
        </style>
      </head>
      <body>
        <h1>JobBoost API Server</h1>
        <p>The server is running successfully!</p>
        
        <div class="links">
          <a href="/api-docs">API Documentation</a>
          <a href="/api/health">API Health Check</a>
        </div>
        
        <h2>Available Routes:</h2>
        <ul>
          <li><code>GET /api/health</code> - Check API health</li>
          <li><code>GET /api/auth-check</code> - Verify authentication</li>
          <li><code>GET /api/v1/conversations</code> - Get all conversations</li>
          <li><code>GET /api-docs</code> - Interactive API documentation</li>
        </ul>
        
        <h2>Socket.io Testing:</h2>
        <p>To test Socket.io functionality, open the <code>test-socket.html</code> file in your browser.</p>
      </body>
    </html>
  `);
});

// Routes
app.use("/api", routes);

// Error handling middleware
app.use(errorHandler);

module.exports = app;
