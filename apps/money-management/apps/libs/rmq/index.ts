import amqp from "amqplib";
import { ensureError } from "../helpers/ensure-error";
import { RmqService } from "./rmq.service";

export class RmqModule {
	public URL: string;
	public channel: amqp.Channel;
	public service: RmqService;
	public connection: amqp.ChannelModel;

	constructor(
		url: string,
		channel: amqp.Channel,
		service: RmqService,
		connection: amqp.ChannelModel
	) {
		this.URL = url;
		this.channel = channel;
		this.service = service;
		this.connection = connection;
	}

	static create = async (url: string) => {
		try {
			const connection = await amqp.connect(url);
			const channel = await connection.createChannel();
			const service = new RmqService(channel);
			return new RmqModule(url, channel, service, connection);
		} catch (e) {
			throw ensureError(e);
		}
	};

	close = async () => {
		await this.channel.close();
		await this.connection.close();
	};
}
