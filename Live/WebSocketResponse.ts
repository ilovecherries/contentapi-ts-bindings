export enum WebSocketResponseType {
	none = "none",
	message = "message_event",
	activity = "activity_event",
	watch = "watch_event",
	uservariable = "uservariable_event",
	user = "user_event",
	userlist = "userlist_event",
	messageAggregate = "message_aggregate_event",
}
export interface WebSocketResponse {
	id: string;
	type: WebSocketResponseType;
	requestUserId: number;
	data?: object;
	error?: string;
}
