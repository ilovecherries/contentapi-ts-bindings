export interface IIdType {
	id: number;
}

export interface IContentRelativeType extends IIdType {
	contentId: number;
}

export interface IContentUserRelatedType extends IContentRelativeType {
	userId: number;
}