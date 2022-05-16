import axios from "axios";
import { IIdType } from "./Views/Extras/ViewInterfaces";
import { SearchRequest, SearchRequests } from "./Search/SearchRequests";
import { SearchResult, TypedSearchResult } from "./Search/SearchResult";
import { RequestType } from "./Search/RequestType";
import { Content } from "./Views/Content";
import { Message } from "./Views/Message";
import { User } from "./Views/User";
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

const CONTENT_QUICK_QUERY = "~values,keywords,votes,text,commentCount";
type ContentQuick = Omit<Content, "values" | "keywords" | "votes" | "text" | "commentCount">;

export interface GetPageResult {
	content: Content[];
	message?: Message[];
	subpages?: ContentQuick[];
	user: User[]
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
		searches.push(new SearchRequest(
			RequestType.user, "*", userQuery,
		));
		return await this.request(new SearchRequests(
			{
				pageid: id,
				filetype: InternalContentType.file,
			},
			searches
		), headers) as SearchResult<GetPageResult>;
	}
}

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