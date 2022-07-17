import axios from "axios";
import { IIdType } from "./Views/Extras/ViewInterfaces";
import { SearchRequest, SearchRequests } from "./Search/SearchRequests";
import { SearchResult } from "./Search/SearchResult";
import { RequestType } from "./Search/RequestType";
import { Message, User, Content } from "./Views";
import { InternalContentType } from "./Enums";
import { LiveEvent, LiveEventType } from "./Live/LiveEvent";
import { WebSocketRequest } from "./Live/WebSocketRequest";

export enum Status {
	active = "active",
	not_present = "",
}

const defaultHeaders: Record<string, string> = {
	"Content-Type": "application/json",
};

const DEFAULT_PAGINATION = 25;

export interface GetPageOptions {
	messagePage?: number;
	messagePagination?: number;
	subpagePage?: number;
	subpagesPagination?: number;
}

const CONTENT_QUICK_QUERY = "~values,keywords,votes,text,commentCount";
export type ContentQuick = Omit<
	Content,
	"values" | "keywords" | "votes" | "text" | "commentCount"
>;

export interface GetPageResult {
	content: Content[];
	message?: Message[];
	subpages?: ContentQuick[];
	user: User[];
}

export function getPageRequest(
	id: number,
	{
		messagePage,
		messagePagination = DEFAULT_PAGINATION,
		subpagePage,
		subpagesPagination = DEFAULT_PAGINATION,
	}: GetPageOptions = {}
): SearchRequests {
	const searches = [
		new SearchRequest(RequestType.content, "*", "id = @pageid"),
	];
	let userQuery = "id in @content.createUserId";
	if (messagePage !== undefined) {
		searches.push(
			new SearchRequest(
				RequestType.message,
				"*",
				"contentId = @pageid and !notdeleted() and !null(module)",
				"id_desc",
				messagePagination,
				messagePage * messagePagination
			)
		);
		userQuery += " or id in @message.createUserId";
	}
	if (subpagePage !== undefined) {
		searches.push(
			new SearchRequest(
				RequestType.content,
				CONTENT_QUICK_QUERY,
				"parentId = @pageid and !notdeleted() and contentType <> @filetype",
				"id_desc",
				subpagesPagination,
				subpagePage * subpagesPagination,
				"subpages"
			)
		);
		userQuery += " or id in @subpages.createUserId";
	}
	searches.push(new SearchRequest(RequestType.user, "*", userQuery));
	return new SearchRequests(
		{ pageid: id, filetype: InternalContentType.file },
		searches
	);
}

export interface GetUserPageResult {
	content: Content[];
	user: User[];
}

export function getUserPageRequest(userId: number) {
	return new SearchRequests({ userId }, [
		new SearchRequest(RequestType.user, "*", "id = @userId"),
		new SearchRequest(RequestType.content, "*", "!userpage(@userId)"),
	]);
}

export class ContentAPI {
	constructor(private readonly API_URL: string) { }

	get path() {
		return `https://${this.API_URL}/api`;
	}
	get wsPath() {
		return `wss://${this.API_URL}/api/live/ws`;
	}

	async login(username: string, password: string): Promise<string> {
		const body = JSON.stringify({ username, password });
		const res = await axios.post(
			`https://${this.API_URL}/api/User/login`,
			body,
			{ headers: { "Content-Type": "application/json" } }
		);
		const token = res.data as string;
		return token;
	}

	async request<T = Record<string, Record<string, object>>>(
		search: SearchRequests,
		headers = defaultHeaders
	): Promise<SearchResult<T>> {
		const res = await axios.post(
			`https://${this.API_URL}/api/Request`,
			JSON.stringify(search),
			{ headers }
		);
		return res.data as SearchResult<T>;
	}

	getFileURL(hash: string, size: number): string {
		return `https://${this.API_URL}/api/File/raw/${hash}${size ? `?size=${size}&crop=true` : ""
		}`;
	}
}

export type ItemType =
	| "message"
	| "content"
	| "user"
	| "watch"
	| "vote"
	| "uservariable"
	| "ban";

export type ContentAPI_Socket_Function = (data: LiveEvent) => void;

export abstract class ContentAPI_Socket<T> {
	protected readonly api: ContentAPI;
	protected readonly token: string;
	protected readonly retryOnClose: boolean;
	protected lastId?: number;
	protected isReady = false;
	protected requestCounter = 1;
	protected requests: Map<string, ContentAPI_Socket_Function> = new Map();
	private readyQueue: Array<() => void> = [];
	public socket?: T;
	public callback?: ContentAPI_Socket_Function;
	public badtoken?: () => void;
	private pingSendLock = false;
	protected pingTimeoutLength = 2000;
	public pingTimeout?: ReturnType<typeof setTimeout>;

	constructor(
		api: ContentAPI,
		token: string,
		retryOnClose = true,
		lastId?: number
	) {
		this.api = api;
		this.token = token;
		this.retryOnClose = retryOnClose;
		this.lastId = lastId;
		this.socket = this.newSocket();
	}

	abstract closeSocket(): void;

	abstract newSocket(): T;

	onClose() {
		console.error("websocket closed");
		if (this.retryOnClose) {
			console.log("reopening socket...");
			this.socket = this.newSocket();
		}
	}

	onError(data: unknown) {
		console.error("websocket error!: ", data);
	}

	abstract sendMessage(data: string): void;

	public whenReady(callback: () => void) {
		if (this.isReady) {
			callback?.();
		} else {
			this.readyQueue.push(callback);
		}
	}

	protected requestId(): string {
		return `request-${this.requestCounter++}`;
	}

	protected restartSocket(): void {
		this.closeSocket();
	}

	protected onMessage(res: LiveEvent) {
		try {
			switch (res.type) {
			case LiveEventType.lastId:
				this.isReady = true;
				this.readyQueue.map((c) => c());
				this.readyQueue = [];
				this.sendPing();
				break;
			case LiveEventType.request:
				if (res.id && this.requests.has(res.id)) {
					this.requests.get(res.id)?.(res);
					this.requests.delete(res.id);
				}
				break;
			case LiveEventType.badtoken:
				this.closeSocket();
				this.socket = undefined;
				this.isReady = false;
				this.badtoken?.();
				break;
			case LiveEventType.ping:
				if (this.pingTimeout) {
					clearTimeout(this.pingTimeout);
				}
				if (!this.pingSendLock) {
					this.pingSendLock = true;
					setTimeout(() => {
						this.pingSendLock = false;
						this.sendPing();
						this.pingTimeout = setTimeout(() => {
							this.closeSocket();
						}, this.pingTimeoutLength);
					}, this.pingTimeoutLength);
				}
				break;
			case LiveEventType.unexpected:
			case LiveEventType.live:
				if (res.data.lastId) {
					this.lastId = res.data.lastId;
				}
				this.callback?.(res);
				this.sendPing();
				break;
			default:
				this.callback?.(res);
			}
		} catch (err) {
			console.error(err);
		}
	}

	setStatus(contentId: number, status = Status.active) {
		const data: Record<number, string> = {};
		data[contentId] = status;
		const req: WebSocketRequest = {
			type: "setuserstatus",
			data,
			id: this.requestId(),
		};
		this.sendMessage(JSON.stringify(req));
	}

	sendRequest(data: SearchRequests, callback: ContentAPI_Socket_Function) {
		const id = this.requestId();
		const req: WebSocketRequest = {
			id,
			data,
			type: "request",
		};
		this.sendMessage(JSON.stringify(req));
		this.requests.set(id, callback);
	}

	sendPing() {
		const id = this.requestId();
		const req: WebSocketRequest = {
			id,
			type: "ping",
		};
		this.sendMessage(JSON.stringify(req));
	}
}

export interface ContentAPI_SessionState {
	token: string;
	user: User;
}

export class ContentAPI_Session {
	constructor(readonly api: ContentAPI, private token: string) { }

	get headers() {
		return {
			"Content-Type": "application/json",
			Authorization: `Bearer ${this.token}`,
		};
	}

	static async login(
		api: ContentAPI,
		username: string,
		password: string
	): Promise<ContentAPI_Session> {
		return new ContentAPI_Session(api, await api.login(username, password));
	}

	async getUserInfo(): Promise<User> {
		const res = await axios.get(`${this.api.path}/User/me`, {
			headers: this.headers,
		});
		return res.data;
	}

	async getState(): Promise<ContentAPI_SessionState> {
		return { token: this.token, user: await this.getUserInfo() };
	}

	async write<T extends IIdType>(
		type: ItemType,
		itemData: Partial<T>
	): Promise<T> {
		const res = await axios.post(
			`${this.api.path}/Write/${type}`,
			JSON.stringify(itemData),
			{ headers: this.headers }
		);
		return res.data;
	}

	async delete(type: ItemType, id: number) {
		await axios.post(`${this.api.path}/Delete/${type}/${id}`, "", {
			headers: this.headers,
		});
	}

	createSocket<U, T extends ContentAPI_Socket<U>>(
		ctor: new (
			api: ContentAPI,
			token: string,
			retryOnClose?: boolean,
			lastId?: number
		) => T,
		retryOnClose = true,
		lastId?: number
	): T {
		return new ctor(this.api, this.token, retryOnClose, lastId);
	}
}
