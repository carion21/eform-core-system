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
      firstname: 'eform',
      email: 'admin@eform.com',
      phone: '00000000',
      username: 'admin@eform.com',
      // password: '',
    },
  ];

  static KPI_TYPE_OBJECTIVE: string = 'objective';
  static KPI_TYPE_RESULT: string = 'result';

  static KPI_TYPES: string[] = [
    "objective",
    "result"
  ];

  static DEFAULT_KPIS: object[] = [
    {
      name: 'Nombre de PDV à atteindre',
      type: 'objective',
    },
    {
      name: 'Nombre de personnes à toucher',
      type: 'objective',
    },
    {
      name: 'Nombre de casiers mis à la disposition ',
      type: 'objective',
    },
    {
      name: 'Nombre de bouteilles reçues',
      type: 'objective',
    },
    {
      name: 'Nombre de PDV réalisés',
      type: 'result',
    },
    {
      name: 'Nombre de casiers utilisés',
      type: 'result',
    },
    {
      name: 'Nombre de casiers restants',
      type: 'result',
    },
    {
      name: 'Nombre de casiers vendus',
      type: 'result',
    },
    {
      name: 'Nombre de bouteilles vendues',
      type: 'result',
    },
    {
      name: 'Nombre de PDV non référencés par la boisson',
      type: 'result',
    },
  ];

  static DEFAULT_KPI_VALUE_TYPE: string = 'number';

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
      'change_password',
      'profile_find_all',
      'field_type_find_all',
      'user_create',
      'user_find_all',
      'user_find_one',
      'user_find_me',
      'user_update',
      'user_update_password',
      'user_change_status',
      'user_delete',

      'kpi_create',
      'kpi_find_all',
      'kpi_find_one',
      'kpi_update',

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
      'form_update_fields',
      'form_duplicate',
      'store_show',
      'store_list_session',
      'store_show_session',
      'kpi_get_data'
    ],
    supervisor: [
      'change_password',
      'user_find_me',
      'field_type_find_all',
      'store_save',
      'store_show',
      'store_list_session',
      'store_show_session',
      'kpi_find_all',
      'project_find_one',
      'project_fill_kpi',
      'form_find_one',
      'kpi_get_data',
    ],
    sampler: [
      'change_password',
      'user_find_me',
      'field_type_find_all',
      'store_save',
      'store_show',
      'store_list_session',
      'store_show_session',
      'form_find_one',
    ],
    viewer: ['change_password', 'user_find_me'],
  };
}
