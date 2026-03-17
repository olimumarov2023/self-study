import { Injectable, NotFoundException } from '@nestjs/common';
import { SkillStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class RoadmapService {
  constructor(private readonly prisma: PrismaService) {}

  async getFullRoadmap() {
    return this.prisma.roadmapArea.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        skills: {
          orderBy: { sortOrder: 'asc' },
          include: {
            category: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  async getProgress() {
    const [totalSkills, completed] = await Promise.all([
      this.prisma.roadmapSkill.count(),
      this.prisma.roadmapSkill.count({
        where: { status: SkillStatus.COMPLETED },
      }),
    ]);

    const percentage =
      totalSkills === 0 ? 0 : Math.round((completed / totalSkills) * 100);

    return { totalSkills, completed, percentage };
  }

  async updateSkillStatus(skillId: string, status: SkillStatus) {
    const skill = await this.prisma.roadmapSkill.findUnique({
      where: { id: skillId },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    return this.prisma.roadmapSkill.update({
      where: { id: skillId },
      data: { status },
    });
  }
}
