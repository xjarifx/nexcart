import { Request, Response, NextFunction } from "express";

export const getMe = (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: "Get user profile" });
};

export const updateMe = (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: "Update user profile" });
};

export const deleteMe = (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: "Delete user profile" });
};

export const updatePassword = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.json({ message: "Update user password" });
};

export const getAddresses = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.json({ message: "Get user addresses" });
};

export const addAddress = (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: "Add user address" });
};

export const updateAddress = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.json({ message: "Update user address" });
};

export const deleteAddress = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.json({ message: "Delete user address" });
};
