import { Content, User } from "../Views";
import { LiveData } from "./LiveData";

export interface UserlistResult {
	/**
	 * { Content ID: { User ID: Status } }
	 */
	statuses: Record<number, Record<number, string>>;
	objects: { content: Partial<Content>[], user: User[] };
}
