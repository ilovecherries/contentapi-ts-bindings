export enum BanType { none = 0, public = 1, private = 2 }

export enum InternalContentType { none = 0, page = 1, module = 2, file = 3 }

export enum UserAction { create = 1, read = 2, update = 4, delete = 8 }

export enum UserType { user = 1, group = 2 }

export enum AdminLogType {
	none = 0,
	group_assign = 1,
	group_create = 2,
	content_create = 3,
	content_update = 4,
	content_delete = 5,
	username_change = 6,
	rethread = 7,
	user_create = 8,
	user_register = 9,
	login_failure = 10,
	user_delete = 11,
	ban_create = 12,
	ban_edit = 13,
	login_temporary = 14,
	login_passwordexpired = 15,
}

export enum VoteType { none = 0, bad = 1, ok = 2, good = 3 }
