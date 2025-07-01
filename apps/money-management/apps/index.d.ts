import { Request } from "express";

export interface ARequest extends Request {
	user?: any;
}

export type BaseOmit<T> = Omit<
	T,
	"insert" | "update" | "id" | "createdAt" | "updatedAt"
>;
