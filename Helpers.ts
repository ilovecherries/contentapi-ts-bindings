import axios from "axios";
import { IIdType } from "./Views/Extras/ViewInterfaces";
import { SearchRequest, SearchRequests } from "./Search/SearchRequests";
import { SearchResult, TypedSearchResult } from "./Search/SearchResult";
import { RequestType } from "./Search/RequestType";
import { Content } from "./Views/Content";
import { Message } from "./Views/Message";
import { InternalContentType } from "./Enums";

export enum Status {
	active = "active",
	not_present = "",
}

const defaultHeaders: Record<string, string> = {
	"Content-Type": "application/json",
};

const defaultPagination = 25;

export interface GetPageOptions {
	messagePage?: number;
	messagePagination?: number;
	subpagePage?: number;
	subpagesPagination?: number;
}

export interface GetPageResult {
	content: Content[];
	messaage?: Message[];
	subpages?: Content[];
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
			`https://${this.API_URL}/api/User/login`, 
			body, 
			{ headers: { "Content-Type": "application/json" }}
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
			{ headers }
		);
		return res.data as SearchResult<T>;
	}

	async getPage(
		id: number,
		{
			messagePage,
			messagePagination = 25,
			subpagePage,
			subpagesPagination = 25,
		}: GetPageOptions = {},
		headers = defaultHeaders
	): Promise<TypedSearchResult<GetPageResult>> {
		const searches = [
			new SearchRequest(RequestType.content, "*", "id = @pageid"),
		];
		if (messagePage)
			searches.push(
				new SearchRequest(
					RequestType.message,
					"*",
					"contentId = @pageid and !notdeleted() and !null(module)",
					"id_desc",
					messagePagination,
					messagePage * messagePagination,
				),
			)
		if (subpagePage)
			searches.push(
				new SearchRequest(
					RequestType.content,
					"*",
					"parentId = @pageid and !notdeleted() and contenttype <> @filetype",
					"id_desc",
					subpagesPagination,
					subpagePage * subpagesPagination,
					"subpages",
				),
			)
		return await this.request(new SearchRequests(
			{
				pageId: id,
				filetype: InternalContentType.file,
			},
			searches
		), headers) as SearchResult<GetPageResult>;
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