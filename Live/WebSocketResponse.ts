export interface WebSocketResponse {
	id: string;
	type: string;
	requestUserId: number;
	data?: object;
	error?: string;
}