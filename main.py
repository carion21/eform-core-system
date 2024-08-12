import requests as rq


BASE_URL = 'http://127.0.0.1:4525'

NB_TEAM = 2
NB_PROJECT = 1
NB_FORM = 2

USERNAME = 'admin@eform.com'
PASSWORD = 'qwertyuiop1234'


def login():
    try:
        url = BASE_URL + '/auth/signin'
        data = {
            'email': USERNAME,
            'password': PASSWORD
        }
        res = rq.post(url, json=data)
        return res.json()
    except Exception as e:
        print(e)


def create_user(token, user_data):
    try:
        url = BASE_URL + '/user'
        headers = {
            'Authorization': 'Bearer ' + token
        }
        res = rq.post(url, json=user_data, headers=headers)
        return res.json()
    except Exception as e:
        print(e)


def create_team(token, team_data):
    try:
        url = BASE_URL + '/team'
        headers = {
            'Authorization': 'Bearer ' + token
        }
        res = rq.post(url, json=team_data, headers=headers)
        return res.json()
    except Exception as e:
        print(e)


def create_project(token, project_data):
    try:
        url = BASE_URL + '/project'
        headers = {
            'Authorization': 'Bearer ' + token
        }
        res = rq.post(url, json=project_data, headers=headers)
        return res.json()
    except Exception as e:
        print(e)


def create_form(token, form_data):
    try:
        url = BASE_URL + '/form'
        headers = {
            'Authorization': 'Bearer ' + token
        }
        res = rq.post(url, json=form_data, headers=headers)
        return res.json()
    except Exception as e:
        print(e)


def add_field(token, field_data):
    try:
        url = BASE_URL + '/form/add-field/' + str(field_data.get('formId'))
        headers = {
            'Authorization': 'Bearer ' + token
        }
        res = rq.patch(url, json=field_data, headers=headers)
        return res.json()
    except Exception as e:
        print(e)


def add_form_to_project(token, project_id, form_ids):
    try:
        url = BASE_URL + '/project/add-form/' + str(project_id)
        headers = {
            'Authorization': 'Bearer ' + token
        }
        res = rq.patch(url, json={'formids': form_ids}, headers=headers)
        return res.json()
    except Exception as e:
        print(e)


def add_team_to_project(token, project_id, team_ids):
    try:
        url = BASE_URL + '/project/add-team/' + str(project_id)
        headers = {
            'Authorization': 'Bearer ' + token
        }
        res = rq.patch(url, json={'teamids': team_ids}, headers=headers)
        return res.json()
    except Exception as e:
        print(e)


login_data = login()

token = login_data.get('data').get('jwt')
factor = 0

team_datas = []
for i in range(NB_TEAM):
    team_data = {
        'name': 'Team ' + str(i+1+factor),
    }
    # create 1 supervisor
    supervisor_data = create_user(token, {
        "lastname": "Supervisor",
        "firstname": str(i+1+factor),
        "email": "supervisor" + str(i+1+factor) + "@eform.com",
        "phone": "0123456789",
        "password": "123456",
        "role": "supervisor",
    })
    print(supervisor_data.get('message'))
    # create 2 samplers
    sampler_datas = []
    for j in range(2):
        sampler_data = create_user(token, {
            "lastname": "Sampler",
            "firstname": str(i+1+factor) + str(j+1+factor),
            "email": "sampler" + str(i+1+factor) + str(j+1+factor) + "@eform.com",
            "phone": "0123456789",
            "password": "123456",
            "role": "sampler",
        })
        print(sampler_data.get('message'))
        sampler_datas.append(sampler_data)
    team_data['members'] = [supervisor_data.get('data').get(
        'id')] + [sampler.get('data').get('id') for sampler in sampler_datas]

    print(team_data)
    r_team = create_team(token, team_data)
    print(r_team.get('message'))
    team_datas.append(r_team.get('data'))


field_datas = [
    [
        {
            'label': 'Nom client',
            'description': 'Nom du client',
            'fieldTypeId': 1,
            'optionnal': False,
            'defaultValue': 'Client 1',
            'exampleValue': 'Client 1',
            'selectValues': ''
        },
        {
            'label': 'Produit',
            'description': 'Produit acheté',
            'fieldTypeId': 12,
            'optionnal': False,
            'defaultValue': '',
            'exampleValue': '',
            'selectValues': 'Ivoire Classic, Ivoire Gold, Ivoire Silver'
        }
    ],
    [
        {
            'label': 'Casiers utilisés',
            'description': 'Nombre de casiers utilisés',
            'fieldTypeId': 5,
            'optionnal': False,
            'defaultValue': '10',
            'exampleValue': '10',
            'selectValues': ''
        },
        {
            'label': 'Casiers restants',
            'description': 'Nombre de casiers restants',
            'fieldTypeId': 5,
            'optionnal': False,
            'defaultValue': '5',
            'exampleValue': '5',
            'selectValues': ''
        },
        {
            'label': 'Casiers vendus',
            'description': 'Nombre de casiers vendus',
            'fieldTypeId': 5,
            'optionnal': False,
            'defaultValue': '5',
            'exampleValue': '5',
            'selectValues': ''
        },
    ],
]

for k in range(NB_PROJECT):
    project_data = {
        'name': 'Project ' + str(k+1+factor),
        'description': 'Description ' + str(k+1+factor),
    }
    r_project = create_project(token, project_data)
    print(r_project.get('message'))
    # create 2 forms
    form_datas = []
    for l in range(2):
        form_data = {
            'name': 'Form ' + str(k+1+factor) + str(l+1+factor),
            'description': 'Description ' + str(k+1+factor) + str(l+1+factor),
        }
        r_form = create_form(token, form_data)
        print(r_form.get('message'))
        fdas = field_datas[l]
        for fd in fdas:
            fd['formId'] = r_form.get('data').get('id')
            r_field = add_field(token, fd)
            print(r_field.get('message'))
        form_datas.append(r_form.get('data'))
    r_afp = add_form_to_project(token, r_project.get('data').get('id'), [
                                fd.get('id') for fd in form_datas])
    print(r_afp.get('message'))

    r_atp = add_team_to_project(token, r_project.get('data').get('id'), [
                                td.get('id') for td in team_datas])
    print(r_atp.get('message'))
