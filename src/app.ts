import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";

import viewRoutes from "./routes/web/view";
import healthRoutes from "./routes/health";
import  {limiter} from "./middlewares/rateLimiter";

export const app = express();

// View Engine
app.set("view engine", "ejs");
app.set("views", "src/views");

// Global Middleware
app
  .use(morgan("dev"))
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use(cors())
  .use(helmet())
  .use(compression())
  .use(limiter);

// Routes
app.use("/api/v1", healthRoutes);
app.use("/", viewRoutes);

// Home Route (Optional)
app.get("/", (req: Request, res: Response) => {
  res.render("index");
});

// Global Error Handler
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  const status = error.statusCode || 500;
  const message = error.message || "Server Error";
  const errorCode = error.code || "ERROR_CODE";

  res.status(status).json({
    success: false,
    message,
    error: errorCode,
  });
});

export default app;
