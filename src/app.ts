import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";

import * as errorController from "./controllers/web/errorController";
import viewRoutes from "./routes/web/view";
import healthRoutes from "./routes/v1/health";
import authRoutes from "./routes/v1/auth";
import { auth } from "./middlewares/auth";
import { limiter } from "./middlewares/rateLimiter";
import userRoutes from "./routes/admin/user";
import cookieParser from "cookie-parser";

export const app = express();

// View Engine

app.set("view engine", "ejs");
app.set("views", "src/views");
var whitelist = ["http://example1.com", "http://localhost:3000"];
var corsOptions = {
  origin: function (
    origin: any,
    callback: (err: Error | null, origin?: any) => void,
  ) {
    if (!origin) return callback(null, true); // Allow requests with no origin (like mobile apps or curl requests)
    if (whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow cookies to be sent with requests
};

// Global Middleware

app
  .use(morgan("dev"))
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use(cookieParser())
  .use(cors(corsOptions))
  .use(helmet())
  .use(compression())
  .use(limiter);

app.use(express.static("public"));

// API Routes

app.use("/api/v1", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admins", auth, userRoutes);

// Home Route

app.get("/", (req: Request, res: Response) => {
  res.render("index", {
    title: "Furniture Backend",
  });
});

// Web Routes

app.use("/", viewRoutes);

// 404 Error Handler

app.use(errorController.notFound);

// Global Error Handler

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  const status = error.status || 500;
  const message = error.message || "Server Error";
  const errorCode = error.code || "ERROR_CODE";

  res.status(status).json({
    message,
    error: errorCode,
  });
});

export default app;
