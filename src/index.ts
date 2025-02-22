import { createApp } from "./config/app.js";
import { configureSession } from "./config/session.js";
import { setupRoutes } from "./config/routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import passport from "./config/passport.js";
import session from "express-session";

async function startServer() {
  try {
    const app = createApp();
    const { config: sessionConfig } = configureSession();

    // Setup session and authentication
    app.use(session(sessionConfig));
    app.use(passport.initialize());
    app.use(passport.session());

    // Setup routes
    setupRoutes(app);

    // Error handling
    app.use(errorHandler);

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
