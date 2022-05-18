import { MarkupLanguage } from "./Extras/MarkupLanguage";
import { IContentUserRelatedType } from "./Extras/ViewInterfaces";

export interface MessageValues {
	/**
	 * Markup language
	 */
	m?: MarkupLanguage;
	/**
	 * Nickname
	 */
	n?: string;
	/**
	 * Avatar
	 */
	a?: string;
}

export interface Message extends IContentUserRelatedType {
	id: number;
	contentId: number;
	createUserId: number;
	createDate: string;
	text: string;
	values: MessageValues;
	editDate: string | null;
	editUserId: number | null;
	edited: boolean;
	deleted: boolean;
	module: string | null;
	receiveUserId: number;
	uidsInText: number[];
}
