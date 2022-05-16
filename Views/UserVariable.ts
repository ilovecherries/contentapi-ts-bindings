import { IIdType } from "./Extras/ViewInterfaces";

export interface UserVariable extends IIdType {
	id: number;
	userId: number;
	createDate: string;
	editDate?: string;
	editCount: number;
	key: string;
	value: string;
}