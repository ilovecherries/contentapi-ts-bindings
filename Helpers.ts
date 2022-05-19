import axios from "axios";
import { IIdType } from "./Views/Extras/ViewInterfaces";
import { SearchRequest, SearchRequests } from "./Search/SearchRequests";
import { SearchResult } from "./Search/SearchResult";
import { RequestType } from "./Search/RequestType";
import { Message, User, Content } from "./Views";
import { InternalContentType } from "./Enums";
import { LiveData } from "./Live/LiveData";
import { LiveEvent, LiveEventType } from "./Live/LiveEvent";
import { WebSocketResponse, WebSocketResponseType } from "./Live/WebSocketResponse";
import { WebSocketRequest } from "./Live/WebSocketRequest";

export enum Status { active = "active", not_present = "" }

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
	}: GetPageOptions = {},
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
				messagePage * messagePagination,
			),
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
				"subpages",
			),
		);
		userQuery += " or id in @subpages.createUserId";
	}
	searches.push(new SearchRequest(RequestType.user, "*", userQuery));
	return new SearchRequests(
		{ pageid: id, filetype: InternalContentType.file },
		searches,
	);
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
			{ headers: { "Content-Type": "application/json" } },
		);
		const token = res.data as string;
		return token;
	}

	async request<T = Record<string, Record<string, object>>>(
		search: SearchRequests,
		headers = defaultHeaders,
	): Promise<SearchResult<T>> {
		const res = await axios.post(
			`https://${this.API_URL}/api/Request`,
			JSON.stringify(search),
			{ headers },
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

export class ContentAPI_Socket {
	private isReady = false;
	private requestCounter = 1;
	private requests: Map<string, ContentAPI_Socket_Function> = new Map();
	public socket = this.newSocket();
	public callback: ContentAPI_Socket_Function = (_) => { };
	public badtoken: () => void = () => { };

	constructor(
		private readonly api: ContentAPI,
		private readonly token: string,
		private readonly retryOnClose = true,
		private lastId?: number,
	) { }

	private newSocket(): WebSocket {
		let params = new URLSearchParams();
		params.set("token", this.token);
		if (this.lastId) {
			params.set("lastId", this.lastId.toString());
		}
		const socket = new WebSocket(`${this.api.wsPath}?${params.toString()}`);

		socket.onmessage =
			(event) => {
				try {
					const res = JSON.parse(event.data) as LiveEvent;

					switch (res.type) {
						case LiveEventType.lastId:
							this.isReady = true;
							break;
						case LiveEventType.request:
							if (res.id && this.requests.has(res.id)) {
								this.requests.get(res.id)?.(res);
								this.requests.delete(res.id);
							}
							break;
						case LiveEventType.badtoken:
							this.socket.close();
							this.socket = undefined;
							this.isReady = false;
							this.badtoken();
							break;
						case LiveEventType.unexpected:
						// TODO: WE WILL HAVE REAL CASES THAT HANDLED THIS
						case LiveEventType.live:
							if (res.data.lastId) {
								this.lastId = res.data.lastId;
							}
						default:
							this.callback(res);
					}
				} catch (err) {
					console.error(err);
				}
			};

		return socket;
	}

	whenReady(callback: () => void) {
		try {
			const x = () => {
				if (this.isReady) {
					callback();
				} else {
					setTimeout(x, 20);
				}
			};
			setTimeout(x, 20);
		} catch (err) {
			console.error(err);
		}
	}

	private requestId(): string {
		return `request-${this.requestCounter++}`;
	}

	setStatus(contentId: number, status = Status.active) {
		const data = {};
		data[contentId] = status;
		const req: WebSocketRequest = {
			type: "setuserstatus",
			data,
			id: this.requestId(),
		};
		this.whenReady(() => {
			this.socket.send(JSON.stringify(req));
		});
	}

	sendRequest(data: SearchRequests, callback: ContentAPI_Socket_Function) {
		const req: WebSocketRequest = {
			id: this.requestId(),
			data,
			type: "request",
		};
		this.whenReady(() => {
			this.socket.send(JSON.stringify(req));
			this.requests.set(req.id, callback);
		});
	}
}

export interface ContentAPI_SessionState {
	token: string;
	user: User;
}

export class ContentAPI_Session {
	public socket: ContentAPI_Socket;

	constructor(private readonly api: ContentAPI, private token: string) { }

	get headers() {
		return {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${this.token}`,
		};
	}

	static async login(api: ContentAPI, username: string, password: string): Promise<
		ContentAPI_Session
	> {
		return new ContentAPI_Session(api, await api.login(username, password));
	}

	async getUserInfo(): Promise<User> {
		const res = await axios.get(
			`${this.api.path}/User/me`,
			{ headers: this.headers },
		);
		return res.data;
	}

	async getState(): Promise<ContentAPI_SessionState> {
		return { token: this.token, user: await this.getUserInfo() };
	}

	async write<T extends IIdType>(type: ItemType, itemData: Partial<T>): Promise<
		T
	> {
		const res = await axios.post(
			`${this.api.path}/Write/${type}`,
			JSON.stringify(itemData),
			{ headers: this.headers },
		);
		return res.data;
	}

	async delete(type: ItemType, id: number) {
		await axios.post(
			`${this.api.path}/Delete/${type}/${id}`,
			"",
			{ headers: this.headers },
		);
	}

	async uploadFile(imageData: Blob, bucket?: string): Promise<string> {
		const formData = new FormData();
		formData.append("file", imageData);
		if (bucket) {
			formData.append("globalPerms", ".");
			formData.append("values[bucket]", bucket);
		}
		const headers = {
			...this.headers,
			"Content-Type": "multipart/form-data",
			"Content-Length": imageData.size,
		};
		const res = await axios.post(`${this.api.path}/File`, formData, { headers });
		const data = res.data as Content;
		return data.hash;
	}

	createSocket(retryOnClose = true, lastId?: number): ContentAPI_Socket {
		return new ContentAPI_Socket(this.api, this.token, retryOnClose, lastId);
	}
}
