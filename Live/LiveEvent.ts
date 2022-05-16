import { UserAction } from "../Enums";

export interface LiveEvent {
	id: number;
	date: string;
	userId: number;
	action: UserAction;
	type: string;
	refId: number;
}