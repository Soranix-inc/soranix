import { ARequest } from "@/index";
import { NextFunction, Response } from "express";
import { BudgetConfigService } from "./budgetconfig.service";
import { UpdateBudgetConfigDto } from "./dto/update-budgetconfig.dto";

export class BudgetConfigController {
	constructor(private readonly budgetConfig: BudgetConfigService) {}

	findBudgetConfigById = async (
		req: ARequest,
		res: Response,
		nxt: NextFunction
	) => {
		try {
			const id = req.params.id;
			const resoponse = await this.budgetConfig.findById(id);
			res.json(resoponse);
		} catch (e) {
			nxt(e);
		}
	};
	findBudgetConfigByUserId = async (
		req: ARequest,
		res: Response,
		nxt: NextFunction
	) => {
		try {
			const id = req.params.id;
			const response = await this.budgetConfig.findByUserId(id);
			res.json(response);
		} catch (e) {
			nxt(e);
		}
	};
	getBudgetConfigs = async (
		req: ARequest,
		res: Response,
		nxt: NextFunction
	) => {
		try {
			const query = req.query;
			const response = await this.budgetConfig.get(query);
			res.json(response);
		} catch (e) {
			nxt(e);
		}
	};
	updateBudgetConfig = async (
		req: ARequest,
		res: Response,
		nxt: NextFunction
	) => {
		try {
			const id = req.params.id;
			const updates: UpdateBudgetConfigDto = req.body;
			const response = await this.budgetConfig.update(id, updates);
			res.json(response);
		} catch (e) {
			nxt(e);
		}
	};
}
