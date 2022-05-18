import { UserAction } from "../Enums";
import { LiveData } from "./LiveData";
import { WebSocketResponseType as WebSocketResponseType } from "./WebSocketResponse";

export enum LiveEventType {
	live = "live",
	request = "request",
	userlistupdate = "userlistupdate",
	lastId = "lastId",
	unexpected = "unexpected",
	badtoken = "badtoken",
}

export interface LiveEvent {
	id: string;
	data: LiveData;
	date: string;
	userId: number;
	action: UserAction;
	type: LiveEventType | WebSocketResponseType;
	refId: number;
}
