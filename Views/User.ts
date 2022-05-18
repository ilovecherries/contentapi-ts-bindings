import { UserType } from "../Enums";
import { IIdType } from "./Extras/ViewInterfaces";

export interface User extends IIdType {
	id: number;
	username: string;
	avatar: string;
	special?: string;
	type: UserType;
	createDate: string;
	createUserId: number;
	super: boolean;
	registered: boolean;
	deleted: boolean;
	groups: number[];
	usersInGroup: number[];
}
