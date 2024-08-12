import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { genProjectCode, translate } from 'utilities/functions';
import { AddTeamDto } from './dto/add-team.dto';
import { AddFormDto } from './dto/add-form.dto';

@Injectable()
export class ProjectService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createProjectDto: CreateProjectDto, userAuthenticated: any) {
    const {
      name,
      description,
      bottlesDistributed,
      drinkRacks,
      peopleToReach,
      salesPointToReach,
      formId,
      teamids,
    } = createProjectDto;

    // Create a new project
    const project = await this.prismaService.project.create({
      data: {
        code: genProjectCode(),
        name,
        description,
        bottlesDistributed,
        drinkRacks,
        peopleToReach,
        salesPointToReach,
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

      // Attach the form to the project
      await this.prismaService.form.update({
        where: {
          id: formId,
        },
        data: {
          projectId: project.id,
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

    // Return the response
    return {
      message: translate('Projet créé avec succès'),
      data: project,
    };
  }

  async findAll() {
    const projects = await this.prismaService.project.findMany({
      include: {
        Form: {
          include: {
            Field: {
              select: {
                id: true,
                code: true,
                label: true,
                slug: true,
                description: true,
                optionnal: true,
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
        Form: {
          include: {
            Field: {
              select: {
                id: true,
                code: true,
                label: true,
                slug: true,
                description: true,
                optionnal: true,
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
        id,
        isDeleted: false,
      },
    });
    if (!project) throw new NotFoundException(translate('Projet introuvable'));

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

  async update(id: number, updateProjectDto: UpdateProjectDto) {
    const {
      name,
      description,
      bottlesDistributed,
      drinkRacks,
      peopleToReach,
      salesPointToReach,
      formId,
      teamids,
    } = updateProjectDto;

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
        bottlesDistributed,
        drinkRacks,
        peopleToReach,
        salesPointToReach,
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

      // Attach the form to the project
      await this.prismaService.form.update({
        where: {
          id: formId,
        },
        data: {
          projectId: id,
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

  async addForm(id: number, addFormDto: AddFormDto, userAuthenticated: any) {
    const { formids } = addFormDto;

    if (formids.length === 0)
      throw new BadRequestException(
        translate('Veuillez sélectionner au moins un formulaire'),
      );

    // Retrieve the project
    const project = await this.prismaService.project.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!project) throw new NotFoundException(translate('Projet introuvable'));

    const forms = await this.prismaService.form.findMany({
      where: {
        id: {
          in: formids,
        },
      },
    });
    if (forms.length !== formids.length)
      throw new NotFoundException(
        translate("Il semble que certains formulaires n'existent pas"),
      );

    // Detach all forms from the project
    await this.prismaService.form.updateMany({
      where: {
        projectId: id,
      },
      data: {
        projectId: null,
      },
    });

    // Attach forms to the project
    await this.prismaService.form.updateMany({
      where: {
        id: {
          in: formids,
        },
      },
      data: {
        projectId: id,
      },
    });

    // Return the response
    return {
      message: translate('Formulaire.s ajouté avec succès au projet'),
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
