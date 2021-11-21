const request = require('supertest');

const app = require('../app');

const { ROLES } = require('../src/config/constants');
const { generateAccessToken } = require('../src/services/jwt');

const database = require('../src/database');
const { User } = require('../src/database/models');

const USERS_PATH = '/users';

const FIRST_USER = {
  username: 'user1',
  name: 'User 1',
  email: 'user1@test.com',
  password: '12345',
};

const NEW_USER = {
  username: 'myusername',
  name: 'Tester user',
  email: 'tester@test.com',
};

describe('Users routes', () => {
  let firstUserAccessToken;
  let secondUserAccessToken;
  let adminUserAccessToken;

  beforeAll(async () => {
    await database.init();

    const firstUser = await User.create(FIRST_USER);
    firstUserAccessToken = generateAccessToken(firstUser.id, firstUser.role);

    const secondUser = await User.create(Object.assign(FIRST_USER, { active: false }));
    secondUserAccessToken = generateAccessToken(secondUser.id, secondUser.role);

    const adminUser = await User.create(Object.assign(FIRST_USER, { role: ROLES.admin }));
    adminUserAccessToken = generateAccessToken(adminUser.id, adminUser.role);
  });

  it('Should create user', async () => {
    const payload = {
      password: '12345',
      passwordConfirmation: '12345',
      ...NEW_USER,
    };
    const response = await request(app).post(USERS_PATH).send(payload);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');

    expect(response.body.data.name).toBe(payload.name);
    expect(response.body.data.username).toBe(payload.username);
    expect(response.body.data.email).toBe(payload.email);
    expect(response.body.data.createdAt).not.toBeNull();
    expect(response.body.data.updatedAt).not.toBeNull();
    expect(response.body.data.lastLoginDate).toBeNull();

    expect(response.body.data.password).toBeUndefined();
    expect(response.body.data.passwordConfirmation).toBeUndefined();
    expect(response.body.data.active).toBeUndefined();

    expect(response.body.paginationInfo).toBeNull();
  });

  it('Should return bad request on create user with invalid payload', async () => {
    const payload = {
      password: '12345',
      passwordConfirmation: '12345',
    };
    const response = await request(app).post(USERS_PATH).send(payload);

    expect(response.statusCode).toBe(400);
    expect(response.body.status).toBe('Payload must contain name, username, email and password');
  });

  it('Should return bad request with missmatch passwords', async () => {
    const payload = {
      password: '12',
      passwordConfirmation: '12345',
      ...NEW_USER,
    };
    const response = await request(app).post(USERS_PATH).send(payload);

    expect(response.statusCode).toBe(400);
    expect(response.body.status).toBe('Passwords do not match');
  });

  it('Should get user by id', async () => {
    const USER_ID = 1;
    const response = await request(app).get(`${USERS_PATH}/${USER_ID}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');

    expect(response.body.data.name).toBe(FIRST_USER.name);
    expect(response.body.data.username).toBe(FIRST_USER.username);
    expect(response.body.data.email).toBe(FIRST_USER.email);
    expect(response.body.data.createdAt).not.toBeNull();
    expect(response.body.data.updatedAt).not.toBeNull();
    expect(response.body.data.lastLoginDate).toBeNull();

    expect(response.body.data.password).toBeUndefined();
    expect(response.body.data.active).toBeUndefined();

    expect(response.body.paginationInfo).toBeNull();
  });

  it('Should return bad request when user does not exist', async () => {
    const USER_ID = 0;
    const response = await request(app).get(`${USERS_PATH}/${USER_ID}`);

    expect(response.statusCode).toBe(400);
    expect(response.body.status).toBe('User not found');
  });

  it('Should return bad request on get a deactivated user', async () => {
    const USER_ID = 2;
    const response = await request(app).get(`${USERS_PATH}/${USER_ID}`);

    expect(response.statusCode).toBe(400);
    expect(response.body.status).toBe('User not found');
  });

  it('Should update user', async () => {
    const USER_ID = 1;
    const payload = {
      username: 'new_username',
      email: 'new_email@test.com',
      name: 'New name',
    };
    const response = await request(app)
      .put(`${USERS_PATH}/${USER_ID}`)
      .set('Authorization', `bearer ${firstUserAccessToken}`)
      .send(payload);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');

    expect(response.body.data.name).toBe(payload.name);
    expect(response.body.data.username).toBe(payload.username);
    expect(response.body.data.email).toBe(payload.email);
    expect(response.body.data.createdAt).not.toBeNull();
    expect(response.body.data.updatedAt).not.toBeNull();
    expect(response.body.data.lastLoginDate).toBeNull();

    expect(response.body.data.password).toBeUndefined();
    expect(response.body.data.active).toBeUndefined();

    expect(response.body.paginationInfo).toBeNull();
  });

  it('Should return unauthorized on update deactivated user', async () => {
    const USER_ID = 2;
    const payload = {
      username: 'new_username',
      email: 'new_email@test.com',
      name: 'New name',
    };
    const response = await request(app)
      .put(`${USERS_PATH}/${USER_ID}`)
      .set('Authorization', `bearer ${firstUserAccessToken}`)
      .send(payload);

    expect(response.statusCode).toBe(403);
    expect(response.body.status).toBe('User not authorized');
  });

  it('Should return bad request on update user with invalid payload', async () => {
    const USER_ID = 1;
    const payload = {
      password: '12345',
    };
    const response = await request(app)
      .put(`${USERS_PATH}/${USER_ID}`)
      .set('Authorization', `bearer ${firstUserAccessToken}`)
      .send(payload);

    expect(response.statusCode).toBe(400);
    expect(response.body.status).toBe('Payload can only contain username, email or name');
  });

  it('Should deactivate user', async () => {
    const USER_ID = 1;
    const response = await request(app)
      .delete(`${USERS_PATH}/${USER_ID}`)
      .set('Authorization', `bearer ${firstUserAccessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toBeNull();

    const totalUsers = await User.count({ where: { active: true } });
    expect(totalUsers).toBe(1);
  });

  it('Should return unauthorized on deactivate user when does not exist', async () => {
    const USER_ID = 0;
    const response = await request(app)
      .delete(`${USERS_PATH}/${USER_ID}`)
      .set('Authorization', `bearer ${firstUserAccessToken}`);

    expect(response.statusCode).toBe(403);
    expect(response.body.status).toBe('User not authorized');
  });

  it('Should login with username and password', async () => {
    const payload = {
      username: 'myusername',
      password: '12345',
    };
    const response = await request(app).post(`${USERS_PATH}/login`).send(payload);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.accessToken).not.toBeNull();
  });

  it('Should return error on login with wrong password', async () => {
    const payload = {
      username: 'myusername',
      password: '00000',
    };
    const response = await request(app).post(`${USERS_PATH}/login`).send(payload);

    expect(response.statusCode).toBe(400);
    expect(response.body.status).toBe('User not found');
  });

  it('Should admin role get all users', async () => {
    const response = await request(app)
      .get(`${USERS_PATH}/all`)
      .set('Authorization', `bearer ${adminUserAccessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.length).toBe(4);

    expect(response.body.paginationInfo).not.toBeNull();
    expect(response.body.paginationInfo.totalItems).toBe(4);
    expect(response.body.paginationInfo.totalPages).toBe(1);
    expect(response.body.paginationInfo.currentPage).toBe(1);

    expect(response.body.data[0].createdAt).not.toBeNull();
    expect(response.body.data[0].updatedAt).not.toBeNull();
    expect(response.body.data[0].lastLoginDate).toBeNull();

    expect(response.body.data[0].password).toBeUndefined();
    expect(response.body.data[0].active).toBeUndefined();
  });

  it('Should return unauthorized on get all users without auth token', async () => {
    const response = await request(app)
      .get(`${USERS_PATH}/all`);

    expect(response.statusCode).toBe(401);
    expect(response.body.status).toBe('Access token required');
  });

  it('Should return JWT error on get all users with malformed auth token', async () => {
    const response = await request(app)
      .get(`${USERS_PATH}/all`)
      .set('Authorization', `bearer 12345`);

    console.log(response.body)

    expect(response.statusCode).toBe(400);
    expect(response.body.status).toBe('jwt malformed');
  });

  it('Should return forbidden on get all users with regular role', async () => {
    const response = await request(app)
      .get(`${USERS_PATH}/all`)
      .set('Authorization', `bearer ${secondUserAccessToken}`);

    expect(response.statusCode).toBe(403);
    expect(response.body.status).toBe('Role not authorized');
  });

  it('Should go to next page on get all users', async () => {
    const response = await request(app)
      .get(`${USERS_PATH}/all?page=2&limit=2`)
      .set('Authorization', `bearer ${adminUserAccessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.length).toBe(2);

    expect(response.body.paginationInfo).not.toBeNull();
    expect(response.body.paginationInfo.totalItems).toBe(4);
    expect(response.body.paginationInfo.totalPages).toBe(2);
    expect(response.body.paginationInfo.currentPage).toBe(2);

    expect(response.body.data[0].createdAt).not.toBeNull();
    expect(response.body.data[0].updatedAt).not.toBeNull();
    expect(response.body.data[0].lastLoginDate).toBeNull();

    expect(response.body.data[0].password).toBeUndefined();
    expect(response.body.data[0].active).toBeUndefined();
  });
});
