import axios from "axios";
import { IIdType } from "./Views/Extras/ViewInterfaces";

export enum Status {
	active = "active",
	not_present = "",
}

export class ContentAPI {
	constructor(
		private readonly API_URL: string,
	) {};

	get path() { return `https://${this.API_URL}/api`; }
	get wsPath() { return `wss://${this.API_URL}/api/live/ws`; }

	async login(username: string, password: string): Promise<string> {
		const body = JSON.stringify({ username, password })
		const res = await axios.post(
			`https://${API_DOMAIN}/api/User/login`, 
			body, 
			{ headers: { "Content-Type": "application/json" }}
		);
		const token = res.data as string;
		return token;
	}
}

// TODO: if there's some way to do this with typenames in the future, that
// would be nice to know but it seems like there isn't
export type ItemType = "message" | "content" | "user" | "watch" | "vote" | "uservariable" | "ban";

export class ContentAPI_Socket {
	private isReady = false;
}

export class ContentAPI_Session {
	constructor(
		private readonly api: ContentAPI,
		private token: string,
	) {}

	get headers() { return {
		"Content-Type": "application/json",
		"Authorization": `Bearer ${this.token}`
	} }

	static async login(
		api: ContentAPI,
		username: string,
		password: string
	): Promise<ContentAPI_Session> {
		return new ContentAPI_Session(
			api,
			await api.login(username, password)
		);
	}

	async write<T extends IIdType>(
		type: ItemType,
		itemData: Partial<T>
	): Promise<T> {
		const res = await axios.post(
			`${this.api.path}/Write/${type}`,
			JSON.stringify(itemData),
			{ headers: this.headers },
		);
		return res.data;
	}

	async delete(
		type: ItemType,
		id: number,
	) {
		await axios.delete(
			`${this.api.path}/Delete/${type}/${id}`,
			{ headers: this.headers },
		);
	}
}