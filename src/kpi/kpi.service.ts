import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateKpiDto } from './dto/create-kpi.dto';
import { UpdateKpiDto } from './dto/update-kpi.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { getSlug, translate } from 'utilities/functions';
import { Consts } from 'utilities/constants';

@Injectable()
export class KpiService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createKpiDto: CreateKpiDto) {
    const { name, type } = createKpiDto;

    const slug = getSlug(name);
    // check if kpi already exists
    const kpiExists = await this.prismaService.kpi.findFirst({
      where: {
        slug,
      },
    });
    if (kpiExists) throw new ConflictException(translate('Ce KPI existe déjà'));

    const kpi = await this.prismaService.kpi.create({
      data: {
        name,
        type,
        slug,
      },
    });
    if (!kpi)
      throw new InternalServerErrorException(
        translate('Une erreur est survenue lors de la création du KPI'),
      );

    // Return the response
    return {
      message: translate('KPI créé avec succès'),
      data: kpi,
    };
  }

  async findAll() {
    const kpis = await this.prismaService.kpi.findMany();

    // Return the response
    return {
      message: translate('Liste des KPIs'),
      data: kpis,
    };
  }

  async findAllObjective() {
    const kpis = await this.prismaService.kpi.findMany({
      where: {
        type: Consts.KPI_TYPE_OBJECTIVE,
      },
    });

    // Return the response
    return {
      message: translate('Liste des KPIs Objectifs'),
      data: kpis,
    };
  }

  async findAllResult() {
    const kpis = await this.prismaService.kpi.findMany({
      where: {
        type: Consts.KPI_TYPE_RESULT,
      },
    });

    // Return the response
    return {
      message: translate('Liste des KPIs Résultats'),
      data: kpis,
    };
  }

  async getData(projectId: number, userAuthenticated: object) {
    const project = await this.prismaService.project.findUnique({
      where: {
        id: projectId,
        isDeleted: false,
      },
    });
    if (!project) throw new NotFoundException(translate('Projet non trouvé'));

    const projectTeams = await this.prismaService.projectTeam.findMany({
      where: {
        projectId,
      },
    });
    const projectTeamIds = projectTeams.map((pt) => pt.teamId);

    const userTeams = await this.prismaService.teamUser.findMany({
      where: {
        userId: userAuthenticated['id'],
      },
    });
    const userTeamIds = userTeams.map((ut) => ut.teamId);

    const teamId = projectTeamIds.find((ptId) => userTeamIds.includes(ptId));
    if (!teamId) throw new NotFoundException(translate('Équipe non trouvée'));

    const team = await this.prismaService.team.findUnique({
      where: {
        id: teamId,
        isDeleted: false,
      },
    });
    if (!team) throw new NotFoundException(translate('Équipe non trouvée'));

    const kpis = await this.prismaService.kpi.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      where: {
        type: Consts.KPI_TYPE_RESULT,
      },
    });
    const kpiIds = kpis.map((kpi) => kpi.id);

    const kpisByTeam = await this.prismaService.kpiByTeam.findMany({
      select: {
        id: true,
        value: true,
        kpiId: true,
      },
      where: {
        projectId,
        teamId,
        kpiId: {
          in: kpiIds,
        },
      },
    });

    const kpiDatas = {};
    for (const kpi of kpis) {
      const kpiByTeam = kpisByTeam.find((kbt) => kbt.kpiId === kpi.id);
      kpiDatas[kpi.slug] = kpiByTeam ? kpiByTeam.value : 0;
    }

    // Return the response
    return {
      message: translate('Données KPI de léquipe'),
      data: kpiDatas,
    };
  }

  async findOne(id: number) {
    const kpi = await this.prismaService.kpi.findUnique({
      where: {
        id,
      },
    });
    if (!kpi) throw new NotFoundException();
    translate("Ce KPI n'existe pas");

    // Return the response
    return {
      message: translate('KPI trouvé avec succès'),
      data: kpi,
    };
  }

  async update(id: number, updateKpiDto: UpdateKpiDto) {
    const { name, type } = updateKpiDto;

    const kpi = await this.prismaService.kpi.findUnique({
      where: {
        id,
      },
    });
    if (!kpi) throw new NotFoundException(translate("Ce KPI n'existe pas"));

    const slug = getSlug(name);
    // check if kpi already exists
    const kpiExists = await this.prismaService.kpi.findFirst({
      where: {
        slug,
        id: {
          not: id,
        },
      },
    });
    if (kpiExists) throw new ConflictException(translate('Ce KPI existe déjà'));

    const updatedKpi = await this.prismaService.kpi.update({
      where: {
        id,
      },
      data: {
        name,
        slug,
      },
    });

    // Return the response
    return {
      message: translate('KPI mis à jour avec succès'),
      data: updatedKpi,
    };
  }
}
