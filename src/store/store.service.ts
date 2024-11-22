import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SaveInStoreDto } from './dto/save-in-store.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { controlData, generateUuid, translate } from 'utilities/functions';
import { Consts } from 'utilities/constants';
import { create } from 'domain';

@Injectable()
export class StoreService {
  constructor(private readonly prismaService: PrismaService) {}

  async save(saveInStoreDto: SaveInStoreDto, userAuthenticated: any) {
    const { formUuid, data } = saveInStoreDto;

    // check if the form exists
    const form = await this.prismaService.form.findFirst({
      where: {
        uuid: formUuid,
      },
      include: {
        Project: true,
        Field: {
          include: {
            fieldType: true,
          },
        },
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire introuvable'));

    // check if the user has the right to save data in the form
    const formPermission = await this.prismaService.formPermission.findFirst({
      where: {
        formId: form.id,
        profileId: userAuthenticated['profile']['id'],
      },
    });
    if (!formPermission || !formPermission.isActive)
      throw new ForbiddenException(
        translate(
          "Vous n'avez pas le droit de sauvegarder des données via ce formulaire| Profil non autorisé",
        ),
      );

    // check if the user has the right to save data in the project
    const formProject = form.Project[0];
    const projectTeams = await this.prismaService.projectTeam.findMany({
      where: {
        projectId: formProject.id,
      },
      select: {
        team: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    });
    const projectTeamIds = projectTeams
      .filter((projectTeam) => projectTeam.team.isActive)
      .map((projectTeam) => projectTeam.team.id);
    // console.log('projectTeamIds', projectTeamIds);

    const userTeams = await this.prismaService.teamUser.findMany({
      where: {
        userId: userAuthenticated['id'],
      },
      select: {
        teamId: true,
      },
    });
    const userTeamIds = userTeams.map((userTeam) => userTeam.teamId);
    // console.log('userTeamIds', userTeamIds);

    const commonTeamIds = projectTeamIds.filter((teamId) =>
      userTeamIds.includes(teamId),
    );
    // console.log('commonTeamIds', commonTeamIds);

    if (commonTeamIds.length === 0)
      throw new ForbiddenException(
        translate(
          "Vous n'avez pas le droit de sauvegarder des données via ce formulaire| Équipe non autorisée",
        ),
      );

    const fields = form.Field;

    let mapFieldTypes = {};
    fields.forEach((field) => {
      let k = field.slug;
      let v = field.fieldType.value;
      mapFieldTypes[k] = v;
    });

    const allFields = fields.map((field) => field.slug);
    const requiredFields = fields
      .filter((field) => !field.optional)
      .map((field) => field.slug);

    const mapSelectValues = {};
    fields.forEach((field) => {
      if (field.fieldType.value === 'select') {
        // selectValues is string split by comma -> convert to array
        mapSelectValues[field.slug] = field.selectValues.split(';');
      }
    });

    let inputs = {
      data: data,
      mapFieldTypes: mapFieldTypes,
      allFields: allFields,
      requiredFields: requiredFields,
      mapSelectValues: mapSelectValues,
    };
    const bcontrol = controlData(inputs);
    if (!bcontrol.success)
      throw new BadRequestException(translate(bcontrol.message));

    // Save the data in the store
    const sessionUuid = generateUuid();
    const dataRows = await this.prismaService.dataRow.createMany({
      data: fields.map((field) => ({
        sessionUuid: sessionUuid,
        userId: userAuthenticated['id'],
        fieldId: field.id,
        value: data[field.slug].toString(),
      })),
    });

    // Return the response
    return {
      message: translate('Données sauvegardées avec succès'),
    };
  }

  async show(formUuid: string, userAuthenticated: any, sessionUuid?: string) {
    // Récupérer le formulaire avec ses champs et vérifier son existence
    const form = await this.prismaService.form.findFirst({
      where: { uuid: formUuid, isDeleted: false },
      include: { Field: { include: { fieldType: true } } },
    });
    if (!form) throw new NotFoundException(translate('Formulaire introuvable'));
    if (!form.isActive)
      throw new ForbiddenException(translate('Formulaire désactivé'));

    // Vérifier les permissions de l'utilisateur
    const isAdminOrViewer = [
      Consts.ADMIN_PROFILE,
      Consts.VIEWER_PROFILE,
    ].includes(userAuthenticated['profile']['value']);

    if (!isAdminOrViewer) {
      const formPermission = await this.prismaService.formPermission.findFirst({
        where: {
          formId: form.id,
          profileId: userAuthenticated['profile']['id'],
          isActive: true,
        },
      });
      if (!formPermission) {
        throw new ForbiddenException(
          translate(
            "Vous n'avez pas le droit de consulter les données de ce formulaire",
          ),
        );
      }
    }

    // Récupérer les données en fonction des permissions et filtrer si sessionUuid est présent
    const dataRows = await this.prismaService.dataRow.findMany({
      where: {
        fieldId: { in: form.Field.map((field) => field.id) },
        ...(isAdminOrViewer ? {} : { userId: userAuthenticated['id'] }),
        ...(sessionUuid ? { sessionUuid } : {}),
      },
      select: {
        sessionUuid: true,
        fieldId: true,
        value: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            isActive: true,
            profile: {
              select: {
                label: true,
                value: true,
              },
            },
          },
        },
      },
    });

    // Organiser les données par sessionUuid
    const data = dataRows.reduce((acc, row) => {
      const field = form.Field.find((f) => f.id === row.fieldId);
      if (field) {
        if (!acc[row.sessionUuid]) acc[row.sessionUuid] = {};
        acc[row.sessionUuid][field.label] = row.value;
        acc[row.sessionUuid]['slug_' + field.slug] = row.value;
        acc[row.sessionUuid]['createdAt'] = row.createdAt;
        acc[row.sessionUuid]['user'] = row.user;
      }
      return acc;
    }, {});

    // Préparer les données pour la réponse
    const dataWithoutSessionUuid = Object.values(data);

    return {
      message: translate('Données récupérées avec succès'),
      data: dataWithoutSessionUuid,
    };
  }

  async listSession(formUuid: string, userAuthenticated: any) {
    // Vérifier l'existence du formulaire et récupérer les champs associés
    const form = await this.prismaService.form.findFirst({
      where: { uuid: formUuid, isDeleted: false },
      include: { Field: { select: { id: true } } },
    });
    if (!form) throw new NotFoundException(translate('Formulaire introuvable'));

    // Vérifier les permissions de l'utilisateur
    const isAdminOrViewer = [
      Consts.ADMIN_PROFILE,
      Consts.VIEWER_PROFILE,
    ].includes(userAuthenticated['profile']['value']);

    if (!isAdminOrViewer) {
      const formPermission = await this.prismaService.formPermission.findFirst({
        where: {
          formId: form.id,
          profileId: userAuthenticated['profile']['id'],
          isActive: true,
        },
      });
      if (!formPermission) {
        throw new ForbiddenException(
          translate(
            "Vous n'avez pas le droit de consulter les données de ce formulaire",
          ),
        );
      }
    }

    // Récupérer les sessions avec UUID et date de création en fonction des permissions
    const dataRows = await this.prismaService.dataRow.findMany({
      where: {
        fieldId: { in: form.Field.map((field) => field.id) },
        ...(isAdminOrViewer ? {} : { userId: userAuthenticated['id'] }),
      },
      select: {
        sessionUuid: true,
        createdAt: true,
      },
      distinct: ['sessionUuid'],
    });

    // Ajouter formUuid à chaque session pour la réponse et ordonner par date de création desc
    const sessions = dataRows
      .map(({ sessionUuid, createdAt }) => ({
        formUuid,
        sessionUuid,
        createdAt,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Retourner la réponse
    return {
      message: translate('Sessions récupérées avec succès'),
      data: sessions,
    };
  }

  async showSession(
    formUuid: string,
    sessionUuid: string,
    userAuthenticated: any,
  ) {
    return await this.show(formUuid, userAuthenticated, sessionUuid);
  }
}
