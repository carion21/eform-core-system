import { Injectable } from '@nestjs/common';
import { CreateStatisticDto } from './dto/create-statistic.dto';
import { UpdateStatisticDto } from './dto/update-statistic.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { translate } from 'utilities/functions';

@Injectable()
export class StatisticsService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll() {
    // count all projects
    const countProjects = await this.prismaService.project.count({
      where: {
        isDeleted: false,
      },
    });

    // count all teams
    const countTeams = await this.prismaService.team.count({
      where: {
        isDeleted: false,
      },
    });

    // count all users
    const countUsers = await this.prismaService.user.count({
      where: {
        isDeleted: false,
      },
    });

    // count all dataRows
    // Get all forms
    const forms = await this.prismaService.form.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        Project: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
          },
        },
      },
    });
    // Get all fieldIds
    const fields = await this.prismaService.field.findMany({
      where: {
        formId: {
          in: forms.map((form) => form.id),
        },
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });
    const fieldIds = fields.map((field) => field.id);
    // Get all distinct sessionUuids
    const distinctSessionUuids = await this.prismaService.dataRow.findMany({
      where: {
        fieldId: {
          in: fieldIds,
        },
      },
      distinct: ['sessionUuid'], // distinct sur sessionUuid
      select: {
        sessionUuid: true,
      },
    });

    // Prepare the data
    const data = {
      countProjects: countProjects,
      countTeams: countTeams,
      countUsers: countUsers,
      countDataRows: distinctSessionUuids.length,
    };

    // Return the response
    return {
      message: translate('Statistiques récupérées avec succès'),
      data: data,
    };
  }
}
