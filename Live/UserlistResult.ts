import { LiveData } from "./LiveData";

export interface UserlistResult extends LiveData {
	/**
	 * { Content ID: { User ID: Status } }
	 */
	statuses: Record<number, Record<number, string>>;
}
