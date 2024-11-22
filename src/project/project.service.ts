import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { controlData, genProjectCode, sumListKpiValues, translate } from 'utilities/functions';
import { AddTeamDto } from './dto/add-team.dto';
import { Consts } from 'utilities/constants';
import { parse } from 'path';
import { FillKpiDto } from './dto/fill-kpi.dto';

@Injectable()
export class ProjectService {
  // Add teams to the project
  constructor(private readonly prismaService: PrismaService) {}

  async create(createProjectDto: CreateProjectDto, userAuthenticated: any) {
    const { name, description, formId, teamids, kpiValues } = createProjectDto;

    // Create a new project
    const project = await this.prismaService.project.create({
      data: {
        code: genProjectCode(),
        name,
        description,
      },
    });
    if (!project)
      throw new InternalServerErrorException(
        translate('Erreur lors de la création du projet'),
      );

    if (formId) {
      // Retrieve the form
      const form = await this.prismaService.form.findUnique({
        where: {
          id: formId,
        },
      });
      if (!form)
        throw new NotFoundException(translate('Formulaire introuvable'));

      // Attach the project to the form
      await this.prismaService.project.update({
        where: {
          id: project.id,
        },
        data: {
          formId,
        },
      });
    }

    // Add teams to the project
    if (teamids.length > 0) {
      const teams = await this.prismaService.team.findMany({
        where: {
          id: {
            in: teamids,
          },
        },
      });
      if (teams.length !== teamids.length)
        throw new NotFoundException(
          translate("Il semble que certaines équipes n'existent pas"),
        );

      // Add teams to the project
      await this.prismaService.projectTeam.createMany({
        data: teams.map((team) => ({
          projectId: project.id,
          teamId: team.id,
        })),
      });
    }

    // Add KPI values to the project
    const kpis = await this.prismaService.kpi.findMany({
      where: {
        type: Consts.KPI_TYPE_OBJECTIVE,
      },
    });

    let mapFieldTypes = {};
    kpis.forEach((kpi) => {
      let k = kpi.slug;
      let v = Consts.DEFAULT_KPI_VALUE_TYPE;
      mapFieldTypes[k] = v;
    });

    const allFields = kpis.map((kpi) => kpi.slug);
    const requiredFields = kpis.map((kpi) => kpi.slug);
    const mapSelectValues = {};

    let inputs = {
      data: kpiValues,
      mapFieldTypes: mapFieldTypes,
      allFields: allFields,
      requiredFields: requiredFields,
      mapSelectValues: mapSelectValues,
    };
    const bcontrol = controlData(inputs);
    if (!bcontrol.success)
      throw new BadRequestException(translate(bcontrol.message));

    const projectKpis = await this.prismaService.kpiByProject.createMany({
      data: kpis.map((kpi) => ({
        projectId: project.id,
        kpiId: kpi.id,
        value: parseFloat(kpiValues[kpi.slug]),
      })),
    });

    // Return the response
    return {
      message: translate('Projet créé avec succès'),
      data: project,
    };
  }

  async findAll() {
    const projects = await this.prismaService.project.findMany({
      include: {
        form: {
          include: {
            Field: {
              select: {
                id: true,
                code: true,
                label: true,
                slug: true,
                description: true,
                optional: true,
                defaultValue: true,
                exampleValue: true,
                selectValues: true,
                fieldType: {
                  select: {
                    id: true,
                    label: true,
                    value: true,
                  },
                },
              },
            },
          },
        },
        ProjectTeam: {
          include: {
            team: true,
          },
        },
      },
      where: {
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Return the response
    return {
      message: translate('Liste des projets'),
      data: projects,
    };
  }

  async findOne(id: number) {
    const project = await this.prismaService.project.findUnique({
      include: {
        form: {
          include: {
            Field: {
              select: {
                id: true,
                code: true,
                label: true,
                slug: true,
                description: true,
                optional: true,
                defaultValue: true,
                exampleValue: true,
                selectValues: true,
                fieldType: {
                  select: {
                    id: true,
                    label: true,
                    value: true,
                  },
                },
              },
            },
          },
        },
        ProjectTeam: {
          include: {
            team: {
              select: {
                id: true,
                code: true,
                name: true,
                isActive: true,
                isDeleted: true,
                TeamUser: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        email: true,
                        firstname: true,
                        lastname: true,
                        phone: true,
                        profile: {
                          select: {
                            label: true,
                            value: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!project) throw new NotFoundException(translate('Projet introuvable'));

    const kpiResults = await this.prismaService.kpi.findMany({
      where: {
        type: Consts.KPI_TYPE_RESULT,
      },
    });
    const kpiResultsIds = kpiResults.map((kpi) => kpi.id);
    console.log('kpiResultsIds', kpiResultsIds);
    

    // get teams with isDeleted = false
    const teams = project.ProjectTeam.map((pt) => pt.team).filter(
      (team) => !team.isDeleted,
    );
    // put team users in team
    teams.forEach(async (team) => {
      // count dataRows with memberIds
      console.log('=====================');
      console.log('team', team.id);
      
      team['dataRowsCount'] = 0;
      const userIds = team.TeamUser.map((tu) => tu.userId);
      const countDataRows = await this.prismaService.dataRow.count({
        where: {
          userId: {
            in: userIds,
          },
        },
      });
      team['dataRowsCount'] = countDataRows;

      // put kpi values in team

      let kpisByTeam = await this.prismaService.kpiByTeam.findMany({
        where: {
          projectId: id,
          teamId: team.id,
          kpiId: {
            in: kpiResultsIds,
          },
        },
        include: {
          kpi: true,
        },
      });
      let kpiValues = {};
      kpiResults.forEach((kpi) => {
        kpiValues[kpi.slug] = 0;
        // find kpi value
        const kpiByTeam = kpisByTeam.find((kbt) => kbt.kpiId === kpi.id);
        if (kpiByTeam) kpiValues[kpi.slug] = kpiByTeam.value;
      });
      console.log('kpiValues of team', team.id, kpiValues);
      
      team['kpiValues'] = kpiValues;

      team['members'] = team.TeamUser.map((tu) => tu.user);

      Reflect.deleteProperty(team, 'isDeleted');
      Reflect.deleteProperty(team, 'TeamUser');
    });
    Reflect.deleteProperty(project, 'ProjectTeam');
    project['teams'] = teams;

    // get kpi values
    const kpisByProject = await this.prismaService.kpiByProject.findMany({
      where: {
        projectId: id,
        kpi: {
          type: Consts.KPI_TYPE_OBJECTIVE,
        },
      },
      include: {
        kpi: true,
      },
    });
    // put kpi values in project
    let kpiObjectivesValues = {};
    kpisByProject.forEach((kpiByProject) => {
      kpiObjectivesValues[kpiByProject.kpi.slug] = kpiByProject.value;
    });
    project['kpiObjectivesValues'] = kpiObjectivesValues;

    // get kpi results values
    let kpiResultsValues = {};
    kpiResultsValues = sumListKpiValues(teams.map((team) => team['kpiValues']));
    project['kpiResultsValues'] = kpiResultsValues;

    // Return the response
    return {
      message: translate('Détails du projet'),
      data: project,
    };
  }

  async duplicate(id: number, userAuthenticated: any) {
    const project = await this.prismaService.project.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!project) throw new NotFoundException(translate('Projet introuvable'));

    // Duplicate the project
    const duplicatedProject = await this.prismaService.project.create({
      data: {
        code: genProjectCode(),
        name: project.name + ' (Copie)',
        description: project.description,
        duplicatedFrom: project.id,
      },
    });
    if (!duplicatedProject)
      throw new InternalServerErrorException(
        translate('Erreur lors de la duplication du projet'),
      );

    // Return the response
    return {
      message: translate('Projet dupliqué avec succès'),
      data: duplicatedProject,
    };
  }

  async fillKpi(id: number, fillKpiDto: FillKpiDto, userAuthenticated: object) {
    // Add teams to the project
    const { kpiDatas } = fillKpiDto;

    // Retrieve the project
    const project = await this.prismaService.project.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!project) throw new NotFoundException(translate('Projet introuvable'));

    // control kpiDatas
    const kpis = await this.prismaService.kpi.findMany({
      where: {
        type: Consts.KPI_TYPE_RESULT,
      },
    });

    let mapFieldTypes = {};
    kpis.forEach((kpi) => {
      let k = kpi.slug;
      let v = Consts.DEFAULT_KPI_VALUE_TYPE;
      mapFieldTypes[k] = v;
    });

    const allFields = kpis.map((kpi) => kpi.slug);
    const requiredFields = kpis.map((kpi) => kpi.slug);
    const mapSelectValues = {};

    let inputs = {
      data: kpiDatas,
      mapFieldTypes: mapFieldTypes,
      allFields: allFields,
      requiredFields: requiredFields,
      mapSelectValues: mapSelectValues,
    };
    const bcontrol = controlData(inputs);
    if (!bcontrol.success)
      throw new BadRequestException(translate(bcontrol.message));

    // Get team of the user
    const uteams = await this.prismaService.teamUser.findMany({
      where: {
        userId: userAuthenticated['id'],
      },
      select: {
        teamId: true,
      },
    });
    const teamIds = uteams.map((uteam) => uteam.teamId);
    const team = await this.prismaService.projectTeam.findFirst({
      where: {
        projectId: id,
        teamId: {
          in: teamIds,
        },
      },
    });
    if (!team)
      throw new NotFoundException(
        translate(
          'Vous ne pouvez pas remplir ces KPIs| Equipe introuvable ou non autorisée',
        ),
      );

    // Remove all KPI values from the project
    await this.prismaService.kpiByTeam.deleteMany({
      where: {
        projectId: id,
        teamId: team.teamId,
      },
    });
    // Re-create all KPI values to the project
    await this.prismaService.kpiByTeam.createMany({
      data: kpis.map((kpi) => ({
        projectId: id,
        teamId: team.teamId,
        kpiId: kpi.id,
        value: parseInt(kpiDatas[kpi.slug]),
      })),
    });

    // Return the response
    return {
      message: translate('KPIs remplis avec succès'),
    };
  }

  async update(id: number, updateProjectDto: UpdateProjectDto) {
    const { name, description, formId, teamids, kpiValues } = updateProjectDto;

    // Retrieve the project
    const project = await this.prismaService.project.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!project) throw new NotFoundException(translate('Projet introuvable'));

    // Update the project
    const updatedProject = await this.prismaService.project.update({
      where: {
        id,
      },
      data: {
        name,
        description,
      },
    });
    if (!updatedProject)
      throw new InternalServerErrorException(
        translate('Erreur lors de la mise à jour du projet'),
      );

    if (formId) {
      // Retrieve the form
      const form = await this.prismaService.form.findUnique({
        where: {
          id: formId,
        },
      });
      if (!form)
        throw new NotFoundException(translate('Formulaire introuvable'));

      // Attach the project to the form
      await this.prismaService.project.update({
        where: {
          id: id,
        },
        data: {
          formId,
        },
      });
    }

    // Add teams to the project
    if (teamids && teamids.length > 0) {
      const teams = await this.prismaService.team.findMany({
        where: {
          id: {
            in: teamids,
          },
        },
      });
      if (teams.length !== teamids.length)
        throw new NotFoundException(
          translate("Il semble que certaines équipes n'existent pas"),
        );

      // Remove all teams from the project
      await this.prismaService.projectTeam.deleteMany({
        where: {
          projectId: id,
        },
      });

      // Add teams to the project
      await this.prismaService.projectTeam.createMany({
        data: teams.map((team) => ({
          projectId: id,
          teamId: team.id,
        })),
      });
    }

    if (kpiValues && Object.keys(kpiValues).length > 0) {
      // Update KPI values to the project

      const kpis = await this.prismaService.kpi.findMany();

      let mapFieldTypes = {};
      kpis.forEach((kpi) => {
        let k = kpi.slug;
        let v = Consts.DEFAULT_KPI_VALUE_TYPE;
        mapFieldTypes[k] = v;
      });

      const allFields = kpis.map((kpi) => kpi.slug);
      const requiredFields = kpis.map((kpi) => kpi.slug);
      const mapSelectValues = {};

      let inputs = {
        data: kpiValues,
        mapFieldTypes: mapFieldTypes,
        allFields: allFields,
        requiredFields: requiredFields,
        mapSelectValues: mapSelectValues,
      };
      const bcontrol = controlData(inputs);
      if (!bcontrol.success)
        throw new BadRequestException(translate(bcontrol.message));

      // Remove all KPI values from the project
      await this.prismaService.kpiByProject.deleteMany({
        where: {
          projectId: id,
        },
      });
      // Re-create all KPI values to the project
      const projectKpis = await this.prismaService.kpiByProject.createMany({
        data: kpis.map((kpi) => ({
          projectId: id,
          kpiId: kpi.id,
          value: parseInt(kpiValues[kpi.slug]),
        })),
      });
    }

    // Return the response
    return {
      message: translate('Projet mis à jour avec succès'),
      data: updatedProject,
    };
  }

  async addTeam(id: number, addTeamDto: AddTeamDto, userAuthenticated: any) {
    const { teamids } = addTeamDto;

    if (teamids.length === 0)
      throw new BadRequestException(
        translate('Veuillez sélectionner au moins une équipe'),
      );

    // Retrieve the project
    const project = await this.prismaService.project.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!project) throw new NotFoundException(translate('Projet introuvable'));

    const teams = await this.prismaService.team.findMany({
      where: {
        id: {
          in: teamids,
        },
      },
    });
    if (teams.length !== teamids.length)
      throw new NotFoundException(
        translate("Il semble que certaines équipes n'existent pas"),
      );

    // Remove all teams from the project
    await this.prismaService.projectTeam.deleteMany({
      where: {
        projectId: id,
      },
    });

    // Add teams to the project
    await this.prismaService.projectTeam.createMany({
      data: teams.map((team) => ({
        projectId: id,
        teamId: team.id,
      })),
    });

    // Return the response
    return {
      message: translate('Équipe.s ajoutée avec succès au projet'),
    };
  }

  async changeStatus(id: number, userAuthenticated: any) {
    const project = await this.prismaService.project.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!project) throw new NotFoundException(translate('Projet introuvable'));

    // Update the project
    const updatedProject = await this.prismaService.project.update({
      where: {
        id,
      },
      data: {
        isActive: !project.isActive,
      },
    });
    if (!updatedProject)
      throw new InternalServerErrorException(
        translate('Erreur lors du changement de statut du projet'),
      );

    // Return the response
    return {
      message: translate('Statut du projet modifié avec succès'),
      data: updatedProject,
    };
  }

  async remove(id: number) {
    // Retrieve the project
    const project = await this.prismaService.project.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!project) throw new NotFoundException(translate('Projet introuvable'));

    // Delete the project
    const deletedProject = await this.prismaService.project.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
    if (!deletedProject)
      throw new InternalServerErrorException(
        translate('Erreur lors de la suppression du projet'),
      );

    // Return the response
    return {
      message: translate('Projet supprimé avec succès'),
    };
  }
}
