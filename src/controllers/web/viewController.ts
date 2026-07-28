import {Request, Response, NextFunction} from "express";

export const home=(req: Request, res: Response, next: NextFunction) => {
    res.render("index", { title: "Home Screen" });
}