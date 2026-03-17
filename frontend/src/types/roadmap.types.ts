export type SkillStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED'

export interface RoadmapSkill {
  id: string
  areaId: string
  categoryId?: string
  name: string
  description?: string
  status: SkillStatus
  sortOrder: number
  category?: { id: string; name: string }
}

export interface RoadmapArea {
  id: string
  name: string
  icon?: string
  sortOrder: number
  skills: RoadmapSkill[]
}

export interface RoadmapProgress {
  totalSkills: number
  completed: number
  percentage: number
}
