import { VoteType } from "../Enums";
import { IIdType } from "./Extras/ViewInterfaces";

export interface Content extends IIdType {
	id: number;
	deleted: boolean;
	createUserId: number;
	createDate: string;
	name: string;
	parentId: number;
	text: string;
	literalType?: string;
	meta?: string;
	description?: string;
	hash: string;
	permissions: Record<number, string>;
	keywords: string[];
	votes: Record<VoteType, number>;
	lastCommentId?: number;
	commentCount: number;
	watchCount: number;
	lastRevisionId: number;
}