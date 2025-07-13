import amqp from "amqplib";
import { v4 as uuid } from "uuid";
import { ensureError } from "../helpers/ensure-error";

type Listener<T = any> = (data: T) => any;

export class RmqService {
	constructor(private readonly proxy: amqp.Channel) {}

	send = async <T, R>(to: string, body: T): Promise<R> => {
		const correlationId = uuid();
		const replyQueue = await this.proxy.assertQueue("", {
			exclusive: true,
		});
		const resouce = Buffer.from(JSON.stringify(body));

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				this.proxy.deleteQueue(replyQueue.queue);
				reject(new Error("Request timed out"));
			}, 5000);

			this.proxy.consume(
				replyQueue.queue,
				(msg) => {
					if (msg && msg?.properties.correlationId === correlationId) {
						const result = JSON.parse(msg.content.toString());
						clearTimeout(timeout);
						this.proxy.deleteQueue(replyQueue.queue);
						resolve(result);
					}
				},
				{ noAck: true }
			);

			this.proxy.sendToQueue(to, resouce, {
				correlationId,
				replyTo: replyQueue.queue,
			});
		});
	};

	subscribe = async (on: string, cb: Listener) => {
		try {
			await this.proxy.assertQueue(on, { durable: true });
			this.proxy.consume(
				on,
				async (msg) => {
					if (msg) {
						const incoming = JSON.parse(msg.content.toString());
						let response = cb(incoming);
						if (response instanceof Promise) response = await response;
						this.proxy.sendToQueue(
							msg.properties.replyTo,
							Buffer.from(JSON.stringify(response)),
							{
								correlationId: msg.properties.correlationId,
							}
						);
						this.proxy.ack(msg);
					}
				},
				{ noAck: false }
			);
		} catch (e) {
			throw ensureError(e);
		}
	};
}
