import { SearchRequests } from "../Search/SearchRequests";

export interface WebSocketRequest {
	id?: string;
	type: string;
	data?: SearchRequests | object;
}