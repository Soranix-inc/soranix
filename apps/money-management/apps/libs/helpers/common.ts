import { BeforeInsert, BeforeUpdate, Column, DeleteDateColumn } from "typeorm";

export abstract class Common {
	@DeleteDateColumn({ type: "timestamp", nullable: true }) deletedAt!: Date;
	@Column({ type: "timestamp" }) createdAt!: Date;
	@Column({ type: "timestamp" }) updatedAt!: Date;

	@BeforeInsert()
	insert() {
		const now = new Date();
		this.createdAt = now;
		this.updatedAt = now;
	}

	@BeforeUpdate()
	update() {
		this.updatedAt = new Date();
	}
}
