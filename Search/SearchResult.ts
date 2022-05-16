import { SearchRequests } from "./SearchRequests";

export interface SearchResult {
	search?: SearchRequests;
	databaseTimes: Record<string, number>;
	objects: Record<string, Record<string, object>>;
}