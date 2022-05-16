import { IContentUserRelatedType } from "./Extras/ViewInterfaces";

export interface Message extends IContentUserRelatedType {
	id: number;
	contentId: number;
	createUserId: number;
	createDate: string;text: string;
	values: Record<string, object>;
	editDate?: string;
	editUserId?: number;
	edited: boolean;
	deleted: boolean;
	module?: string;
	receiveUserId: number;
	uidsInText: number[];
}