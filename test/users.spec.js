import request from 'supertest';

import app from '../server';
import User from '../models/user.model';
import { getToken } from '../utils';

describe('Users API', function() {
  this.timeout(20000)

  let client, client_info, client_token,
      admin, admin_info, admin_token,
      realtor, realtor_info, realtor_token;

  before(() => {
    client_info = {
      email: 'abctest@example.com',
      password: 'test1234',
      firstname: 'Abc',
      lastname: 'Tester',
      role: 'client',
      verified: true
    };
    admin_info = {
      email: 'admin@example.com',
      password: 'test1234',
      firstname: 'Admin',
      lastname: 'User',
      role: 'admin',
      verified: true
    };
    realtor_info = {
      email: 'realtor@example.com',
      password: 'test1234',
      firstname: 'Realtor',
      lastname: 'User',
      role: 'realtor',
      verified: true
    }

    return User.create([
      client_info,
      admin_info,
      realtor_info
    ]).then(users => {
      client = users[0];
      admin = users[1];
      realtor = users[2];

      client_token = getToken(users[0]);
      admin_token = getToken(users[1]);
      realtor_token = getToken(users[2]);
    });

  });

  after((done) => {
    User.remove({}).then(() => { done() });
  });

  describe('[GET] /profile', () => {
    it('should success', () => {
      return request(app)
        .get('/api/v1/profile')
        .set('Authorization', 'JWT ' + client_token)
        .send()
        .expect(200)
        .then(({ body }) => {
          delete client_info.password;

          body.success.should.equal(1);
          body.data.should.containDeep(client_info);
        });
    });

    it('should fail with invalid token', () => {
      const token = 'fake token';

      return request(app)
        .get('/api/v1/profile')
        .set('Authorization', 'JWT ' + token)
        .send()
        .expect(401)
        .then((res) => {
          res.text.should.equal('Unauthorized');
        });
    });
  });


  describe('[POST] /users/profile', () => {

    it('should success', (done) => {
      const payload = {
        email: 'abcmodified@example.com',
        firstname: 'ABC Modified',
        lastname: 'User'
      }

      request(app)
        .post('/api/v1/users/profile')
        .set('Authorization', 'JWT ' + client_token)
        .send(payload)
        .expect(200)
        .then(({ body }) => {
          body.success.should.equal(1);
          body.data.should.equal('Profile updated successfully');

          User.findOne({ email: payload.email })
            .then(user => {
              user.should.containDeep(payload);

              done();
            });
        });
    });
  

    it('should fail with invalid email', () => {
      const payload = {
        email: 'abcmodified.example.com'
      }

      return request(app)
        .post('/api/v1/users/profile')
        .set('Authorization', 'JWT ' + client_token)
        .send(payload)
        .expect(400)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('"email" must be a valid email');
        });
    });
  

    it('should fail with empty lastname', () => {
      const payload = {
        lastname: ''
      }

      return request(app)
        .post('/api/v1/users/profile')
        .set('Authorization', 'JWT ' + client_token)
        .send(payload)
        .expect(400)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('"lastname" is not allowed to be empty');
        });
    });

  });

  describe('[POST] /users/change-password', () => {

    it('should success', () => {
      const payload = {
        oldPassword: 'test1234',
        newPassword: 'qwer1234'
      };

      return request(app)
        .post('/api/v1/users/change-password')
        .set('Authorization', 'JWT ' + client_token)
        .send(payload)
        .expect(200)
        .then(({ body }) => {
          body.success.should.equal(1);
          body.data.should.equal('Password changed successfully');
        });
    });

    it('should fail with wrong old password', () => {
      const payload = {
        oldPassword: 'test1234',
        newPassword: 'qwer1234'
      };

      return request(app)
        .post('/api/v1/users/change-password')
        .set('Authorization', 'JWT ' + client_token)
        .send(payload)
        .expect(400)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Wrong password');
        });
    });

    it('should fail with short new password', () => {
      const payload = {
        oldPassword: 'qwer1234',
        newPassword: 'qwer123'
      };

      return request(app)
        .post('/api/v1/users/change-password')
        .set('Authorization', 'JWT ' + client_token)
        .send(payload)
        .expect(400)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('"newPassword" length must be at least 8 characters long');
        });
    });

  });

  describe('[GET] /users', () => {

    it('should success', () => {
      return request(app)
        .get('/api/v1/users')
        .set('Authorization', 'JWT ' + admin_token)
        .expect(200)
        .then(({ body }) => {
          body.success.should.equal(1);

          return User.countDocuments({ role: {$in: ['realtor', 'client']} })
            .then(count => {
              body.data.length.should.equal(count);
            });
        });
    });

    it('should fail with client token', () => {
      return request(app)
        .get('/api/v1/users')
        .set('Authorization', 'JWT ' + client_token)
        .expect(403)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Permission denied');
        });
    });

    it('should fail with realtor token', () => {
      return request(app)
        .get('/api/v1/users')
        .set('Authorization', 'JWT ' + realtor_token)
        .expect(403)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Permission denied');
        });
    });

  });

  describe('[POST] /users', () => {

    let dbUser1;

    beforeEach(() => {
      dbUser1 = {
        email: "realtor1@example.com",
        password: "test1234",
        firstname: "Realtor1",
        lastname: "User",
        role: "realtor",
        verified: "true"
      };
    });

    it('should success', () => {
      return request(app)
        .post('/api/v1/users')
        .set('Authorization', 'JWT ' + admin_token)
        .send(dbUser1)
        .expect(201)
        .then(({ body }) => {
          body.success.should.equal(1);

          return User.countDocuments({ email: dbUser1.email })
            .then(count => {
              count.should.equal(1);
            });
        });
    });

    it('should fail with realtor token', () => {
      return request(app)
        .post('/api/v1/users')
        .set('Authorization', 'JWT ' + realtor_token)
        .send(dbUser1)
        .expect(403)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Permission denied');
        });
    });

    it('should fail with client token', () => {
      return request(app)
        .post('/api/v1/users')
        .set('Authorization', 'JWT ' + client_token)
        .send(dbUser1)
        .expect(403)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Permission denied');
        });
    });

    it('should fail with existing email', () => {
      return request(app)
        .post('/api/v1/users')
        .set('Authorization', 'JWT ' + admin_token)
        .send(dbUser1)
        .expect(422)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Already exists');
        });
    });

    it('should fail with admin role', () => {
      dbUser1.email = 'realtor2@example.com';
      dbUser1.role = 'admin';

      return request(app)
        .post('/api/v1/users')
        .set('Authorization', 'JWT ' + admin_token)
        .send(dbUser1)
        .expect(400)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('"role" must be one of [realtor, client]');
        });
    });

    it('should fail with invalid params', () => {
      dbUser1.email = 'realtor2@example.com';
      dbUser1.password = 'tessss';

      return request(app)
        .post('/api/v1/users')
        .set('Authorization', 'JWT ' + admin_token)
        .send(dbUser1)
        .expect(400)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('"password" length must be at least 8 characters long');
        });
    });

  });

  describe('[GET] /users/:id', () => {

    it('should get a client', () => {
      return request(app)
        .get('/api/v1/users/' + client._id)
        .set('Authorization', 'JWT ' + admin_token)
        .expect(200)
        .then(({ body }) => {
          body.success.should.equal(1);
          body.data.should.have.property('role').which.equal('client');
        });
    });

    it('should get a realtor', () => {
      return request(app)
        .get('/api/v1/users/' + realtor._id)
        .set('Authorization', 'JWT ' + admin_token)
        .expect(200)
        .then(({ body }) => {
          body.success.should.equal(1);
          body.data.should.have.property('role').which.equal('realtor');
        });
    });

    it('should fail with realtor token', () => {
      return request(app)
        .get('/api/v1/users/' + client._id)
        .set('Authorization', 'JWT ' + realtor_token)
        .expect(403)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Permission denied');
        });
    });

    it('should fail with client token', () => {
      return request(app)
        .get('/api/v1/users/' + client._id)
        .set('Authorization', 'JWT ' + client_token)
        .expect(403)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Permission denied');
        });
    });
    
    it('should fail with invalid id', () => {
      return request(app)
        .get('/api/v1/users/' + client._id + 'a')
        .set('Authorization', 'JWT ' + admin_token)
        .expect(404)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Can\'t find the user');
        });
    });

  });


  describe('[PUT] /users/:id', () => {

    beforeEach(() => {
      return User.update({ email: 'client@example.com' }, {
        firstname: 'Abc',
        lastname: 'Tester',
        role: 'client',
        verified: true
      });
    });

    it('should success', (done) => {
      const params = {
        firstname: 'Updated',
        lastname: 'User',
        role: 'realtor',
        verified: false
      };

      request(app)
        .put('/api/v1/users/' + client._id)
        .set('Authorization', 'JWT ' + admin_token)
        .send(params)
        .expect(200)
        .then(({ body }) => {
          body.success.should.equal(1);
          body.data.should.equal('User updated successfully');

          User.findById(client._id, (err, user) => {
              user.should.containDeep(params);

              done();
            });
        });
    });

    it('should fail with realtor token', () => {
      const params = {
        firstname: 'Updated',
        lastname: 'User',
        role: 'realtor',
        verified: false
      };

      return request(app)
        .put('/api/v1/users/' + client._id)
        .set('Authorization', 'JWT ' + realtor_token)
        .send(params)
        .expect(403)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Permission denied');
        });
    });

    it('should fail with client token', () => {
      const params = {
        firstname: 'Updated',
        lastname: 'User',
        role: 'realtor',
        verified: false
      };

      return request(app)
        .put('/api/v1/users/' + client._id)
        .set('Authorization', 'JWT ' + client_token)
        .send(params)
        .expect(403)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Permission denied');
        });
    });

    it('shouldn\'t update role to admin', () => {
      const params = {
        firstname: 'Updated',
        lastname: 'User',
        role: 'admin',
        verified: false
      };

      return request(app)
        .put('/api/v1/users/' + client._id)
        .set('Authorization', 'JWT ' + admin_token)
        .send(params)
        .expect(400)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('"role" must be one of [realtor, client]');
        });
    });

    it('should fail with invalid params', () => {
      const params = {
        firstname: 'Updated',
        lastname: 'User',
        password: 'sdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfssssdfsfsfsss',
        role: 'admin',
        verified: false
      };

      return request(app)
        .put('/api/v1/users/' + client._id)
        .set('Authorization', 'JWT ' + admin_token)
        .send(params)
        .expect(400)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('"password" length must be less than or equal to 255 characters long');
        });
    });

  });


  describe('[DELETE] /users/:id', () => {

    let userId, userId1;

    before(() => {

      return User.create([
        {
          email: 'testuser@example.com',
          password: 'test1234',
          firstname: 'Test',
          lastname: 'Tuser',
          role: 'client',
          verified: true
        },
        {
          email: 'testuser1@example.com',
          password: 'test1234',
          firstname: 'Test1',
          lastname: 'Tuser1',
          role: 'realtor',
          verified: true
        }
      ]).then(users => {
        userId = users[0]._id.valueOf();
        userId1 = users[1]._id.valueOf();
      });

    });

    it('should success', (done) => {
      request(app)
        .delete('/api/v1/users/' + userId)
        .set('Authorization', 'JWT ' + admin_token)
        .expect(200)
        .then(({ body }) => {
          body.success.should.equal(1);
          body.data.should.equal('User deleted successfully');

          User.findById(userId, (err, user) => {
              should.not.exist(user);
              done();
            });
        });
    });

    it('should fail to delete non-existing user', () => {
      return request(app)
        .delete('/api/v1/users/' + userId)
        .set('Authorization', 'JWT ' + admin_token)
        .expect(404)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Can\'t find the user');
        });
    });

    it('should fail with realtor token', () => {
      return request(app)
        .delete('/api/v1/users/' + userId1)
        .set('Authorization', 'JWT ' + realtor_token)
        .expect(403)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Permission denied');
        });
    });

    it('should fail with client token', () => {
      return request(app)
        .delete('/api/v1/users/' + userId1)
        .set('Authorization', 'JWT ' + client_token)
        .expect(403)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Permission denied');
        });
    });

  });

});