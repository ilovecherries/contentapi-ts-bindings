import { AdminLogType } from "../Enums";
import { IIdType } from "./Extras/ViewInterfaces";

export interface AdminLog extends IIdType {
	id: number;
	type: AdminLogType;
	text?: string;
	createDate: string;
	initiator: number;
	target: number;
}
