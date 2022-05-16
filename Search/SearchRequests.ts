import { RequestType } from "./RequestType";

export class SearchRequest {
	constructor(
		public type: RequestType,
		public fields: string,
		public query: string,
		public name: string = "",
		public order: string = "",
		public limit: number = -1,
		public skip: number = 0,
	) {};
}

export class SearchRequests {
	constructor(
		public values: Record<string, object>,
		public requests: SearchRequest[],
	) {};
}