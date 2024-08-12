export class Consts {
  static APP_NAME: string = 'eFORM-CORE-SYSTEM';
  static APP_VERSION: string = '1.0.0';
  static APP_DESCRIPTION: string = 'eFORM Core System';
  static PORT_SYSTEM: number = 4525;

  static GUARDIAN_SYSTEM_VERBOSE: boolean = false;

  static DEFAULT_INPUT_LANG: string = 'en';
  static DEFAULT_OUTPUT_LANG: string = 'fr';

  static MSG_UNAUTHORIZED: string =
    'You do not have permission to perform this operation';

  static ADMIN_PROFILE: string = 'admin';
  static SUPERVISOR_PROFILE: string = 'supervisor';
  static SAMPLER_PROFILE: string = 'sampler';
  static VIEWER_PROFILE: string = 'viewer';

  static PROFILES: object[] = [
    {
      label: 'Admin',
      value: 'admin',
      description: "Il s'agit du profil Admin",
    },
    {
      label: 'Supervisor',
      value: 'supervisor',
      description: "Il s'agit du profil Supervisor",
    },
    {
      label: 'Sampler',
      value: 'sampler',
      description: "Il s'agit du profil Sampler",
    },
    {
      label: 'Viewer',
      value: 'viewer',
      description: "Il s'agit du profil Viewer",
    },
  ];

  static DEFAULT_USERS: any[] = [
    {
      lastname: 'admin',
      firstname: 'ama',
      email: 'admin@eform.com',
      phone: '00000000',
      username: 'admin@eform.com',
      // password: '',
    },
  ];

  static DEFAULT_FIELD_TYPES: object[] = [
    {
      label: 'Simple Text',
      value: 'simple-text',
    },
    {
      label: 'Long Text',
      value: 'long-text',
    },
    {
      label: 'Email',
      value: 'email',
    },
    {
      label: 'Uuid',
      value: 'uuid',
    },
    {
      label: 'Number',
      value: 'number',
    },
    {
      label: 'Integer',
      value: 'integer',
    },
    {
      label: 'Float',
      value: 'float',
    },
    {
      label: 'Date',
      value: 'date',
    },
    {
      label: 'Time',
      value: 'time',
    },
    {
      label: 'Datetime',
      value: 'datetime',
    },
    {
      label: 'Boolean',
      value: 'boolean',
    },
    {
      label: 'Select',
      value: 'select',
    },
  ];

  static ROLES: object = {
    admin: [
      'profile_find_all',
      'user_create',
      'user_find_all',
      'user_find_one',
      'user_update',
      'user_change_status',
      'user_delete',
      'project_create',
      'project_find_all',
      'project_find_one',
      'project_update',
      'project_change_status',
      'project_delete',
      'team_create',
      'team_find_all',
      'team_find_one',
      'team_update',
      'team_change_status',
      'team_delete',
      'form_create',
      'form_find_all',
      'form_find_one',
      'form_update',
      'form_change_status',
      'form_delete',

      'team_add_member',
      'project_duplicate',
      'project_add_team',
      'project_add_form',
      'form_add_field',
      'form_duplicate',
      'store_show',
    ],
    supervisor: ['store_save', 'store_show'],
    sampler: ['store_save', 'store_show'],
    viewer: ['subscription_find_all'],
  };
}