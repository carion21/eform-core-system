import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { genTeamCode, translate } from 'utilities/functions';
import { Consts } from 'utilities/constants';

@Injectable()
export class TeamService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createTeamDto: CreateTeamDto, userAuthenticated: any) {
    const { name, members } = createTeamDto;

    let users = [];
    if (members.length > 0) {
      users = await this.prismaService.user.findMany({
        where: {
          id: {
            in: members,
          },
          isActive: true,
          isDeleted: false,
        },
      });
      if (users.length !== members.length)
        throw new NotFoundException(
          translate("Un ou plusieurs membres n'existent pas"),
        );
    }

    const team = await this.prismaService.team.create({
      data: {
        code: genTeamCode(),
        name,
      },
    });
    if (!team)
      throw new InternalServerErrorException(
        translate("Erreur lors de la création de l'équipe"),
      );

    if (users.length > 0) {
      await this.prismaService.teamUser.createMany({
        data: users.map((user) => ({
          userId: user.id,
          teamId: team.id,
        })),
      });
    }

    // Return the response
    return {
      message: translate('Équipe créée avec succès'),
      data: team,
    };
  }

  async findAll() {
    const teams = await this.prismaService.team.findMany({
      include: {
        TeamUser: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                lastname: true,
                firstname: true,
                profile: {
                  select: {
                    label: true,
                  },
                },
              },
            },
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
      message: translate('Liste des équipes'),
      data: teams,
    };
  }

  async findOne(id: number) {
    const team = await this.prismaService.team.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        TeamUser: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                lastname: true,
                firstname: true,
                profile: {
                  select: {
                    label: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!team) throw new NotFoundException(translate('Équipe non trouvée'));

    // get the projects of the team
    const pteams = await this.prismaService.projectTeam.findMany({
      where: {
        teamId: team.id,
      },
      select: {
        id: true,
        project: {
          select: {
            id: true,
          },
        },
      },
    });
    // get the projects with the project id where is not deleted
    const projects = await this.prismaService.project.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        form: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            uuid: true,
            Field: {
              where: {
                isDeleted: false,
              },
              select: {
                id: true,
              },
            },
          },
        },
        KpiByTeam: {
          where: {
            teamId: team.id,
          },
          select: {
            id: true,
            value: true,
            kpi: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      where: {
        id: {
          in: pteams.map((pteam) => pteam.project.id),
        },
        isDeleted: false,
      },
    });
    // get the fields of the form of projects
    for (const project of projects) {
      const kpis = [];
      for (const kpiByTeam of project.KpiByTeam) {
        kpis.push({
          id: kpiByTeam.kpi.id,
          name: kpiByTeam.kpi.name,
          slug: kpiByTeam.kpi.slug,
          value: kpiByTeam.value,
        });
      }
      project['kpis'] = kpis;
      Reflect.deleteProperty(project, 'KpiByTeam');

      const form = project.form;

      project['formId'] = form ? form.id : null;
      project['formUuid'] = form ? form.uuid : null;
      project['dataRowCount'] = 0;

      if (!form) continue;

      const fieldIds = form.Field.map((field) => field.id);
      const userIds = team.TeamUser.map((teamUser) => teamUser.userId);
      // Utiliser `findMany` avec `distinct`
      const distinctSessionUuids = await this.prismaService.dataRow.findMany({
        where: {
          fieldId: {
            in: fieldIds,
          },
          userId: {
            in: userIds,
          },
        },
        distinct: ['sessionUuid'], // distinct sur sessionUuid
        select: {
          sessionUuid: true,
        },
      });

      // Compter les résultats distincts
      project['dataRowCount'] = distinctSessionUuids.length;

      Reflect.deleteProperty(project, 'form');
    }

    // add the projects to the team
    team['projects'] = projects;

    // Return the response
    return {
      message: translate('Équipe trouvée'),
      data: team,
    };
  }

  async update(
    id: number,
    updateTeamDto: UpdateTeamDto,
    userAuthenticated: any,
  ) {
    const { name, members } = updateTeamDto;

    const team = await this.prismaService.team.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!team) throw new NotFoundException(translate('Équipe non trouvée'));

    let users = [];
    if (members.length > 0) {
      users = await this.prismaService.user.findMany({
        where: {
          id: {
            in: members,
          },
          isActive: true,
          isDeleted: false,
        },
      });
      if (users.length !== members.length)
        throw new NotFoundException(
          translate("Un ou plusieurs membres n'existent pas"),
        );

      await this.prismaService.teamUser.deleteMany({
        where: {
          teamId: team.id,
        },
      });

      await this.prismaService.teamUser.createMany({
        data: users.map((user) => ({
          userId: user.id,
          teamId: team.id,
        })),
      });
    }

    const updatedTeam = await this.prismaService.team.update({
      where: {
        id,
      },
      data: {
        name,
      },
    });
    if (!updatedTeam)
      throw new InternalServerErrorException(
        translate("Erreur lors de la mise à jour de l'équipe"),
      );

    // Return the response
    return {
      message: translate('Équipe mise à jour'),
      data: updatedTeam,
    };
  }

  async changeStatus(id: number, userAuthenticated: any) {
    const team = await this.prismaService.team.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!team) throw new NotFoundException(translate('Équipe non trouvée'));

    const updatedTeam = await this.prismaService.team.update({
      where: {
        id,
      },
      data: {
        isActive: !team.isActive,
      },
    });
    if (!updatedTeam)
      throw new InternalServerErrorException(
        translate("Erreur lors de la mise à jour de l'équipe"),
      );

    // Return the response
    return {
      message: translate('Équipe mise à jour'),
      data: updatedTeam,
    };
  }

  async remove(id: number, userAuthenticated: any) {
    const team = await this.prismaService.team.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!team) throw new NotFoundException(translate('Équipe non trouvée'));

    // Remove all team users
    await this.prismaService.teamUser.deleteMany({
      where: {
        teamId: team.id,
      },
    });

    // Update the team
    const updatedTeam = await this.prismaService.team.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
    if (!updatedTeam)
      throw new InternalServerErrorException(
        translate("Erreur lors de la suppression de l'équipe"),
      );

    // Return the response
    return {
      message: translate('Équipe supprimée'),
    };
  }
}
