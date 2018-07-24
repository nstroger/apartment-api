import request from 'supertest';

import app from '../server';
import User from '../models/user.model';
import { getToken, encodeEmail, noop } from '../utils';

describe('Authentication API', function() {
  this.timeout(20000)

  let dbUser, registerInfo;

  before(() => {
    dbUser = {
      email: 'abctest@example.com',
      firstname: 'Abc',
      lastname: 'Tester',
      role: 'client',
      verified: true
    };

    registerInfo = {
      email: 'abctest@example.com',
      password: 'test1234',
      firstname: 'Abc',
      lastname: 'Tester',
    }

    return User.create({
      email: 'abctest1@example.com',
      password: 'test1234',
      firstname: 'Abc',
      lastname: 'Tester',
      role: 'client',
      verified: false
    });

  });

  after((done) => {
    User.remove({}).then(() => { done() });
  });

  describe('[POST] /users/register: Register user', () => {

    it('should success', () => {
      return request(app)
        .post('/api/v1/users/register')
        .send(registerInfo)
        .expect(201)
        .then(({ body }) => {
          body.success.should.equal(1);
          body.data.should.equal('User registered successfully');
        });
    });

    it('should fail with invalid params', () => {
      return request(app)
        .post('/api/v1/users/register')
        .send(dbUser)
        .expect(400)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('"password" is required');
        });
    });

    it('[POST] /users/register: should fail with an existing user', () => {
      return request(app)
        .post('/api/v1/users/register')
        .send(registerInfo)
        .expect(422)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Already exists');
        });
    });

  });

  describe('[POST] /users/verify', () => {

    it('should fail with invalid token', () => {
      const token = "This is invalid token";

      return request(app)
        .post('/api/v1/users/verify')
        .send({ token })
        .expect(400)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Token is invalid or expired');
        });
    });

    it('should success', () => {
      const token = encodeEmail(dbUser.email);

      return request(app)
        .post('/api/v1/users/verify')
        .send({ token })
        .expect(200)
        .then(({ body }) => {
          body.success.should.equal(1);
          body.data.should.have.property('token').which.is.a.String();
          body.data.should.have.property('user').which.containDeep(dbUser);
        });
    });

  });
  
  describe('[POST] /users/login', () => {

    it('should success', () => {
      const credentials = {
        email: 'abctest@example.com',
        password: 'test1234',
      };

      return request(app)
        .post('/api/v1/users/login')
        .send(credentials)
        .expect(200)
        .then(({ body }) => {
          body.success.should.equal(1);
          body.data.should.have.property('token').which.is.a.String();
          body.data.should.have.property('user').which.containDeep(dbUser);
        });
    });

    it('should fail with an unverified user', () => {
      const credentials = {
        email: 'abctest1@example.com',
        password: 'test1234',
      };

      return request(app)
        .post('/api/v1/users/login')
        .send(credentials)
        .expect(401)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Please verify your email');
        });
    });

    it('should fail with non-existing user', () => {
      const credentials = {
        email: 'abctest2@example.com',
        password: 'test1234',
      };

      return request(app)
        .post('/api/v1/users/login')
        .send(credentials)
        .expect(401)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Invalid email or password');
        });
    });

    it('should fail with wrong password', () => {
      const credentials = {
        email: 'abctest@example.com',
        password: 'test12342',
      };

      return request(app)
        .post('/api/v1/users/login')
        .send(credentials)
        .expect(401)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Invalid email or password');
        });
    });

  });

});