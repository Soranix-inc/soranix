import { ARequest } from "@/index";
import { NextFunction, Response } from "express";
import { BudgetService } from "./budgets.service";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";

export class BudgetController {
	constructor(private readonly service: BudgetService) {}

	getBudgets = async (
		req: ARequest,
		res: Response,
		nxt: NextFunction //
	) => {
		try {
			const query = req.query;
			const response = await this.service.get(query);
			res.json(response);
		} catch (e) {
			nxt(e);
		}
	};

	findBudget = async (
		req: ARequest,
		res: Response,
		nxt: NextFunction //
	) => {
		try {
			const id = req.params.id;
			const response = await this.service.findById(id);
			res.json(response);
		} catch (e) {
			nxt(e);
		}
	};

	makeBudget = async (
		req: ARequest,
		res: Response,
		nxt: NextFunction //
	) => {
		try {
			const body: CreateBudgetDto = req.body;
			const response = await this.service.initialize(body);
			res.json(response);
		} catch (e) {
			nxt(e);
		}
	};

	deleteBudget = async (
		req: ARequest,
		res: Response,
		nxt: NextFunction //
	) => {
		try {
			const id = req.params.id;
			const response = await this.service.delete(id);
			res.json(response);
		} catch (e) {
			nxt(e);
		}
	};

	updateBudget = async (
		req: ARequest,
		res: Response,
		nxt: NextFunction //
	) => {
		try {
			const id = req.params.id;
			const updates: UpdateBudgetDto = req.body;
			const response = await this.service.update(id, updates);
			res.json(response);
		} catch (e) {
			nxt(e);
		}
	};
}
