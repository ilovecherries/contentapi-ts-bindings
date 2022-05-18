import { BanType } from "../Enums";
import { IIdType } from "./Extras/ViewInterfaces";

export interface Ban extends IIdType {
	id: number;
	createDate: string;
	createUserId: number;
	bannedUserId: number;
	expireDate: number;
	message?: string;
	type: BanType;
}
