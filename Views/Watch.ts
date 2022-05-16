import { IContentUserRelatedType } from "./Extras/ViewInterfaces";

export interface Watch extends IContentUserRelatedType {
	id: number;
	contentId: number;
	userId: number;
	lastCommentId: number;
	lastActivityId: number;
	createDate: string;
	editDate: string;
	commentNotifications: number;
	activityNotifications: number;
}