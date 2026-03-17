export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  weightGoal: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  color?: string;
  weightGoal?: number;
}

export interface UpdateCategoryPayload {
  name?: string;
  color?: string;
  weightGoal?: number;
}
