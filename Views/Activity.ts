import { UserAction } from "../Enums";
import { IContentUserRelatedType } from "./Extras/ViewInterfaces";

export interface Activity extends IContentUserRelatedType {
	id: number;
	contentId: number;
	userId: number;
	date: string;
	message?: string;
	action: UserAction;
}
