import { UserAction } from "../Enums";

export enum LiveEventType {
	live = "live",
	request = "request",
	userlistupdate = "userlistupdate",
	lastId = "lastId",
	unexpected = "unexpected",
	badtoken = "badtoken",
}

export interface LiveEvent {
	id: number;
	date: string;
	userId: number;
	action: UserAction;
	type: LiveEventType;
	refId: number;
}