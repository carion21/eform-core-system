import { Injectable } from '@nestjs/common';
import { CreateStatisticDto } from './dto/create-statistic.dto';
import { UpdateStatisticDto } from './dto/update-statistic.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { translate } from 'utilities/functions';
import { Consts } from 'utilities/constants';

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

    // count all supervisors
    const countSupervisors = await this.prismaService.user.count({
      where: {
        isDeleted: false,
        profile: {
          value: Consts.SUPERVISOR_PROFILE,
        },
      },
    });

    // count all samplers
    const countSamplers = await this.prismaService.user.count({
      where: {
        isDeleted: false,
        profile: {
          value: Consts.SAMPLER_PROFILE,
        },
      },
    });

    // get all kpis objective
    const kpis = await this.prismaService.kpi.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
      },
    });

    const kpiObjectives = kpis.filter(
      (kpi) => kpi.type === Consts.KPI_TYPE_OBJECTIVE,
    );
    const kpiResults = kpis.filter(
      (kpi) => kpi.type === Consts.KPI_TYPE_RESULT,
    );

    // Obtenir les sommes des valeurs de chaque KPI dans la table kpiByProject
    const summedKpiObjectives = await this.prismaService.kpiByProject.groupBy({
      by: ['kpiId'],
      _sum: { value: true },
      where: { kpiId: { in: kpiObjectives.map((kpi) => kpi.id) } },
    });
    const summedKpiResults = await this.prismaService.kpiByTeam.groupBy({
      by: ['kpiId'],
      _sum: { value: true },
      where: { kpiId: { in: kpiResults.map((kpi) => kpi.id) } },
    });

    // Associer chaque KPI avec sa somme
    const objectives = kpis.map((kpi) => {
      const kpiSum = summedKpiObjectives.find((sum) => sum.kpiId === kpi.id);
      return {
        id: kpi.id,
        name: kpi.name,
        slug: kpi.slug,
        sumValue: kpiSum ? kpiSum._sum.value : 0, // Définit à 0 si aucune valeur n'est trouvée
      };
    });
    const results = kpis.map((kpi) => {
      const kpiSum = summedKpiResults.find((sum) => sum.kpiId === kpi.id);
      return {
        id: kpi.id,
        name: kpi.name,
        slug: kpi.slug,
        sumValue: kpiSum ? kpiSum._sum.value : 0, // Définit à 0 si aucune valeur n'est trouvée
      };
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
      countProjects,
      countTeams,
      countUsers,
      countSupervisors,
      countSamplers,
      countDataRows: distinctSessionUuids.length,
      kpiObjectives: objectives,
      kpiResults: results,
    };

    // Return the response
    return {
      message: translate('Statistiques récupérées avec succès'),
      data: data,
    };
  }
}
