import { SearchRequests } from "./SearchRequests";

export interface SearchResult<T = Record<string, Array<object>>> {
	search?: SearchRequests;
	databaseTimes: Record<string, number>;
	objects: T;
}

export interface TypedSearchResult<T> {
	search?: SearchRequests;
	databaseTimes: Record<string, number>;
	objects: T;
}
