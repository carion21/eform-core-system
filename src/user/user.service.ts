import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { generatePassword, genUserCode, getUiAvatar, listmonkSendEmail, translate } from 'utilities/functions';

import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto, userAuthenticated: object) {
    const { role, lastname, firstname, email, phone } = createUserDto;

    const tempPassword = generatePassword();
    const emailExists = await this.prismaService.user.findFirst({
      where: {
        email,
      },
    });
    if (emailExists)
      throw new ConflictException(translate('Email déjà utilisé'));

    const profile = await this.prismaService.profile.findFirst({
      where: {
        value: role,
      },
    });
    if (!profile) throw new NotFoundException(translate('Profil non trouvé'));

    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const user = await this.prismaService.user.create({
      data: {
        code: genUserCode(),
        profileId: profile.id,
        lastname,
        firstname,
        email,
        phone,
        password: hashedPassword,
        isNeedChangePass: true,
      },
    });
    if (!user)
      throw new InternalServerErrorException(
        translate("Erreur lors de la création de l'utilisateur"),
      );

    // send email
    const emailTemplateId = 4;
    const emailData = {
      email: user.email,
      profile: profile.label.toUpperCase(),
      temp_password: tempPassword,
      login_url: this.configService.get('BUILDER_BASE_URL') + '/security/login',
    };
    const listmonkEmail = await listmonkSendEmail(
      user,
      emailTemplateId,
      emailData,
    );
    console.log('listmonkEmail', listmonkEmail);

    Reflect.deleteProperty(user, 'password');
    // Return the response
    return {
      message: translate('Utilisateur créé avec succès'),
      data: user,
    };
  }

  async findAll(userAuthenticated: object) {
    const users = await this.prismaService.user.findMany({
      include: {
        profile: {
          select: {
            label: true,
            value: true,
          },
        },
      },
      where: {
        id: {
          not: userAuthenticated['id'],
        },
        isDeleted: false,
      },
    });

    // generate ui avatar if profile picture is not available
    users.forEach((user) => {
      if (!user.profilePicture) user.profilePicture = getUiAvatar(user);
      Reflect.deleteProperty(user, 'password');
    });

    // Return the response
    return {
      message: translate('Liste des utilisateurs'),
      data: users,
    };
  }

  async findOne(id: number) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        profile: {
          select: {
            label: true,
            value: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException(translate('Utilisateur non trouvé'));

    // get the teams of the user
    // we have User - TeamUser - Team - ProjectTeam - Project
    const uteams = await this.prismaService.teamUser.findMany({
      where: {
        userId: id,
      },
      select: {
        id: true,
        userId: true,
        teamId: true,
        team: {
          select: {
            id: true,
            code: true,
            name: true,
            ProjectTeam: {
              select: {
                projectId: true,
                project: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                    formId: true,
                    form: {
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
                  },
                },
              },
            },
          },
        },
      },
    });
    // get the unique projects of the user
    const projects = [];
    uteams.forEach((uteam) => {
      uteam.team.ProjectTeam.forEach((pt) => {
        const project = projects.find((p) => p.id === pt.projectId);
        if (!project) {
          projects.push({
            id: pt.projectId,
            code: pt.project.code,
            name: pt.project.name,
            form: pt.project.form,
          });
        }
      });
    });

    // get the teams of the user
    const teams = [];
    uteams.forEach((uteam) => {
      teams.push({
        id: uteam.teamId,
        code: uteam.team.code,
        name: uteam.team.name,
      });
    });

    // generate ui avatar if profile picture is not available
    if (!user.profilePicture) user.profilePicture = getUiAvatar(user);

    // get the fields of the form of projects
    for (const project of projects) {
      const form = project.form;

      project['formId'] = form ? form.id : null;
      project['formUuid'] = form ? form.uuid : null;
      project['dataRowCount'] = 0;

      if (!form) continue;

      const fieldIds = form.Field.map((field) => field.id);
      // Utiliser `findMany` avec `distinct`
      const distinctSessionUuids = await this.prismaService.dataRow.findMany({
        where: {
          fieldId: {
            in: fieldIds,
          },
          userId: user.id,
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

    // add the projects to the user
    user['projects'] = projects;

    // add the teams to the user
    user['teams'] = teams;

    Reflect.deleteProperty(user, 'password');
    // Return the response
    return {
      message: translate('Utilisateur trouvé'),
      data: user,
    };
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    userAuthenticated: object,
  ) {
    const { lastname, firstname, email, phone } = updateUserDto;

    const user = await this.prismaService.user.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!user) throw new NotFoundException(translate('Utilisateur non trouvé'));
    if (user.email !== email) {
      const emailExists = await this.prismaService.user.findFirst({
        where: {
          email,
        },
      });
      if (emailExists)
        throw new ConflictException(translate('Email déjà utilisé'));
    }

    const updatedUser = await this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        lastname,
        firstname,
        email,
        phone,
      },
    });
    if (!updatedUser)
      throw new InternalServerErrorException(
        translate("Erreur lors de la mise à jour de l'utilisateur"),
      );

    Reflect.deleteProperty(updatedUser, 'password');
    // Return the response
    return {
      message: translate('Utilisateur mis à jour'),
      data: updatedUser,
    };
  }

  async updatePassword(
    id: number,
    updatePasswordDto: UpdatePasswordDto,
    userAuthenticated: object,
  ) {
    const { password } = updatePasswordDto;

    // check if the user exists
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!user) throw new NotFoundException(translate('Utilisateur non trouvé'));

    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        password: hashedPassword,
      },
    });
    if (!updatedUser)
      throw new InternalServerErrorException(
        translate(
          "Erreur lors de la mise à jour du mot de passe de l'utilisateur",
        ),
      );

    // Return the response
    return {
      message: translate('Mot de passe mis à jour'),
    };
  }

  async changeStatus(id: number, userAuthenticated: object) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!user) throw new NotFoundException(translate('Utilisateur non trouvé'));

    const updatedUser = await this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        isActive: !user.isActive,
      },
    });
    if (!updatedUser)
      throw new InternalServerErrorException(
        translate("Erreur lors du changement de statut de l'utilisateur"),
      );

    // Return the response
    return {
      message: translate("Statut de l'utilisateur modifié"),
      data: updatedUser,
    };
  }

  async remove(id: number, userAuthenticated: object) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!user) throw new NotFoundException(translate('Utilisateur non trouvé'));

    const deletedUser = await this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
        deletedAt: moment().format(),
      },
    });
    if (!deletedUser)
      throw new InternalServerErrorException(
        translate("Erreur lors de la suppression de l'utilisateur"),
      );

    // Return the response
    return {
      message: translate('Utilisateur supprimé'),
    };
  }
}
