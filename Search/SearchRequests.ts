import { RequestType } from "./RequestType";

export class SearchRequest {
	constructor(
		public type: RequestType,
		public fields: string,
		public query: string,
		public order: string = "",
		public limit: number = -1,
		public skip: number = 0,
		public name: string = "",
	) {};
}

export class SearchRequests {
	constructor(
		public values: Record<string, any>,
		public requests: SearchRequest[],
	) {};
}