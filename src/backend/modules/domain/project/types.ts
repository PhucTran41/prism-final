export enum ProjectStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export interface ProjectEntity {
  id: number;
  ownerId: number;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}



