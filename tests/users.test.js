const request = require('supertest');

const app = require('../app');

const { ROLES } = require('../src/config/constants');
const { generateAccessToken } = require('../src/services/jwt');

const database = require('../src/database');
const { User, Tweet } = require('../src/database/models');

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
  let firstUserId;

  beforeAll(async () => {
    await database.init();

    const firstUser = await User.create(FIRST_USER);
    firstUserAccessToken = generateAccessToken(firstUser.id, firstUser.role);
    firstUserId = firstUser.id;

    const secondUser = await User.create(Object.assign(FIRST_USER, { active: false }));
    secondUserAccessToken = generateAccessToken(secondUser.id, secondUser.role);

    const adminUser = await User.create(Object.assign(FIRST_USER, { role: ROLES.admin }));
    adminUserAccessToken = generateAccessToken(adminUser.id, adminUser.role);
  });

  beforeEach(async () => { await Tweet.destroy({ truncate: true, cascade: true }); });

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

  it('Should update password', async () => {
    const response = await request(app)
      .put('/users/update_password')
      .set('Authorization', `bearer ${firstUserAccessToken}`)
      .send({
        password: 'password',
        passwordConfirmation: 'password',
      });
    const { status } = response.body;
    expect(status).toBe('success');
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
      .set('Authorization', 'bearer 12345');

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

  it('Should create a comment', async () => {
    const tweetResponse = await request(app)
      .post('/tweets')
      .set('Authorization', `bearer ${firstUserAccessToken}`)
      .send({ text: 'Hola' });
    const tweetId = tweetResponse.body.data.id;
    const commentResponse = await request(app)
      .post(`/tweets/${tweetId}/comments`)
      .set('Authorization', `bearer ${firstUserAccessToken}`)
      .send({ text: 'Cómo estás' });
    const { body } = commentResponse;
    const { status, data } = body;
    const { text } = data;
    expect(status).toBe('success');
    expect(text).toBe('Cómo estás');
  });

  it('Should like a comment', async () => {
    const tweetResponse = await request(app)
      .post('/tweets')
      .set('Authorization', `bearer ${firstUserAccessToken}`)
      .send({ text: 'Hola' });
    const tweetId = tweetResponse.body.data.id;
    const commentResponse = await request(app)
      .post(`/tweets/${tweetId}/comments`)
      .set('Authorization', `bearer ${firstUserAccessToken}`)
      .send({ text: 'Cómo estás' });
    const commentId = commentResponse.body.data.id;
    const likeResponse = await request(app)
      .post(`/comments/${commentId}/likes`)
      .set('Authorization', `bearer ${firstUserAccessToken}`);
    const commentLikes = likeResponse.body.data.likeCounter;
    expect(commentLikes).toBe(1);
  });

  it('Should delete comment', async () => {
    const tweetResponse = await request(app)
      .post('/tweets')
      .set('Authorization', `bearer ${firstUserAccessToken}`)
      .send({ text: 'Hola' });
    const tweetId = tweetResponse.body.data.id;
    const commentResponse = await request(app)
      .post(`/tweets/${tweetId}/comments`)
      .set('Authorization', `bearer ${firstUserAccessToken}`)
      .send({ text: 'Cómo estás' });
    const commentId = commentResponse.body.data.id;
    const deleteResponse = await request(app)
      .delete(`/comments/${commentId}`)
      .set('Authorization', `bearer ${firstUserAccessToken}`);
    const result = deleteResponse.status;
    expect(result).toBe(200);
  });

  it('Should delete tweet', async () => {
    const tweetResponse = await request(app)
      .post('/tweets')
      .set('Authorization', `bearer ${firstUserAccessToken}`)
      .send({ text: 'Hola' });
    const tweetId = tweetResponse.body.data.id;
    const deleteResponse = await request(app)
      .delete(`/tweets/${tweetId}`)
      .set('Authorization', `bearer ${firstUserAccessToken}`);
    const { status } = deleteResponse.body;
    const result = deleteResponse.status;
    expect(result).toBe(200);
    expect(status).toBe('success');
  });

  it('Should not create a comment if there\'s no text', async () => {
    const tweetResponse = await request(app)
      .post('/tweets')
      .set('Authorization', `bearer ${firstUserAccessToken}`)
      .send({ text: 'Hola' });
    const tweetId = tweetResponse.body.data.id;
    const commentResponse = await request(app)
      .post(`/tweets/${tweetId}/comments`)
      .set('Authorization', `bearer ${firstUserAccessToken}`);
    const result = commentResponse.status;
    const { status } = commentResponse.body;
    expect(result).toBe(400);
    expect(status).toBe('Payload must contain text');
  });

  it('Should not create a tweet without text', async () => {
    const tweetResponse = await request(app)
      .post('/tweets')
      .set('Authorization', `bearer ${firstUserAccessToken}`);
    const { status } = tweetResponse.body;
    const statusCode = tweetResponse.status;
    expect(statusCode).toBe(400);
    expect(status).toBe('Payload must contain text');
  });

  it('Should not find unexisting tweets', async () => {
    const findResponse = await request(app)
      .get('/tweets/99999999');
    const statusCode = findResponse.status;
    const { status } = findResponse.body;
    // expect(statusCode).toBe(404);
    expect(status).toBe('Tweet not found');
  });

  it('Should not like unexisting tweets', async () => {
    const likeRespose = await request(app)
      .post('/tweets/999999/likes')
      .set('Authorization', `bearer ${firstUserAccessToken}`);

    const { status } = likeRespose.body;
    const statusCode = likeRespose.status;
    expect(statusCode).toBe(404);
    expect(status).toBe('Tweet not found');
  });

  it('Should not comment unexisting tweets', async () => {
    const commentResponse = await request(app)
      .post('/tweets/99999/comments')
      .set('Authorization', `bearer ${firstUserAccessToken}`)
      .send({ text: 'Lit' });
    const { status } = commentResponse.body;
    const result = commentResponse.status;
    expect(result).toBe(400);
    expect(status).toBe('Tweet not found');
  });

  it('Should not like unexisting comments', async () => {
    const likeResponse = await request(app)
      .post('/comments/99999999/likes')
      .set('Authorization', `bearer ${firstUserAccessToken}`);
    // const statusCode = likeResponse.status;
    const { status } = likeResponse.body;
    expect(status).toBe('Comment not found');
    // expect(statusCode).toBe(404);
  });

  it('Should not delete unexisting comments', async () => {
    const deleteResponse = await request(app)
      .delete('/comments/99999999')
      .set('Authorization', `bearer ${firstUserAccessToken}`);
    const result = deleteResponse.status;
    expect(result).toBe(404);
  });

  it('Should like a tweet', async () => {
    const tweetResponse = await request(app)
      .post('/tweets')
      .set('Authorization', `bearer ${firstUserAccessToken}`)
      .send({ text: 'Hola' });
    const tweetId = tweetResponse.body.data.id;
    const likeResponse = await request(app)
      .post(`/tweets/${tweetId}/likes`)
      .set('Authorization', `bearer ${firstUserAccessToken}`);
    const tweetLikes = likeResponse.body.data.likeCounter;
    expect(tweetLikes).toBe(1);
  });

  it('Should find tweets', async () => {
    const tweetResponse = await request(app)
      .post('/tweets')
      .set('Authorization', `bearer ${firstUserAccessToken}`)
      .send({ text: 'Hola' });
    const tweetId = tweetResponse.body.data.id;
    const searchResponse = await request(app)
      .get(`/tweets/${tweetId}`);
    const tweetText = searchResponse.body.data.text;
    expect(tweetText).toBe('Hola');
  });

  it('Should find users', async () => {
    const watame = await User.create({
      username: 'watame',
      name: 'わため',
      email: 'watame@holo.com',
      password: 'sheep',
    });
    const response = await request(app)
      .get(`/users/${watame.id}`)
      .set('Authorization', `bearer ${firstUserAccessToken}`);
    const { data, status } = response.body;
    expect(status).toBe('success');
    expect(data.username).toBe('watame');
  });

  it('Should not find non-existing users', async () => {
    const response = await request(app)
      .get('/users/99999')
      .set('Authorization', `bearer ${firstUserAccessToken}`);
    const { data, status } = response.body;
    expect(status).toBe('User not found');
  });

  it('Should not delete tweets that the user does not own', async () => {
    const tweetResponse = await request(app)
      .post('/tweets')
      .set('Authorization', `bearer ${firstUserAccessToken}`)
      .send({ text: 'Hola' });
    const tweetId = tweetResponse.body.data.id;
    const deleteResponse = await request(app)
      .delete(`/tweets/${tweetId}`)
      .set('Authorization', `bearer ${secondUserAccessToken}`);
    const { status } = deleteResponse.body;
    const result = deleteResponse.status;
    expect(status).toBe('you can not delete this tweet');
    expect(result).toBe(403);
  });

  it("Should show all user's tweets", async () => {
    await Tweet.create({ userId: firstUserId, text: 'Buenos días amiguitos' });
    await Tweet.create({ userId: firstUserId, text: 'Cómo están?' });
    await Tweet.create({ userId: firstUserId, text: 'Muy bien!' });
    const response = await request(app)
      .get('/tweets')
      .set('Authorization', `bearer ${firstUserAccessToken}`);
    const { data } = response.body;
    expect(data.length).toBe(3);
  });

  it("Should show an user's feed", async () => {
    await Tweet.create({ userId: firstUserId, text: 'awawawawa' });
    await Tweet.create({ userId: firstUserId, text: 'God please, power' });
    await Tweet.create({ userId: firstUserId, text: 'Endless hamma' });
    const response = await request(app)
      .get(`/tweets/feed/${FIRST_USER.username}`);
    const { status } = response.body;
    expect(status).toBe('success');
  });

  it("Should not show user's feed if no token is providad", async () => {
    const response = await request(app)
      .get('/tweets')
      .set('Authorization', 'aaa');
    const { status } = response.body;
    const statusCode = response.status;
    expect(status).toBe('Access token required');
    expect(statusCode).toBe(401);
  });
});
