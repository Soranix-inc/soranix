import { Request } from "express";

export interface ARequest extends Request {
	user?: any;
}

export type BaseOmit<T, K extends keyof T = never> = Omit<
	T,
	"insert" | "update" | "id" | "createdAt" | "updatedAt" | "deletedAt",
	K
>;
