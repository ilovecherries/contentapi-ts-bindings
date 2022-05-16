import { VoteType } from "../Enums";
import { IContentUserRelatedType } from "./Extras/ViewInterfaces";

export interface Vote extends IContentUserRelatedType {
	id: number;
	contentId: number;
	userId: number;
	vote: VoteType;
	createDate: string;
}