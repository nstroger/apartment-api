import request from 'supertest';

import app from '../server';
import User from '../models/user.model';
import Apartment from '../models/apartment.model';
import { getToken } from '../utils';

describe('Apartments API', function() {
  this.timeout(20000);

  let client, client_token,
      admin, admin_token,
      realtor, realtor_token,
      realtor1, realtor1_token;

  let list;

  before(() => {
    return User.create([
      {
        email: 'abctest@example.com',
        password: 'test1234',
        firstname: 'Abc',
        lastname: 'Tester',
        role: 'client',
        verified: true
      }, {
        email: 'admin@example.com',
        password: 'test1234',
        firstname: 'Admin',
        lastname: 'User',
        role: 'admin',
        verified: true
      }, {
        email: 'realtor@example.com',
        password: 'test1234',
        firstname: 'Realtor',
        lastname: 'User',
        role: 'realtor',
        verified: true
      }, {
        email: 'realtor1@example.com',
        password: 'test1234',
        firstname: 'Realtor1',
        lastname: 'User1',
        role: 'realtor',
        verified: true
      }
    ]).then(users => {
      client = users[0];
      admin = users[1];
      realtor = users[2];
      realtor1 = users[3];

      client_token = getToken(users[0]);
      admin_token = getToken(users[1]);
      realtor_token = getToken(users[2]);
      realtor1_token = getToken(users[3]);

      return Apartment.create([
        {
          "name": "Test apartment 1",
          "description": "My apartment 1",
          "floorAreaSize": 99,
          "pricePerMonth": 240.00,
          "numberOfRooms": 3,
          "address": "355 Lansing St, Indianapolis, IN 46202",
          "latitude": 39.773263,
          "longitude": -86.182098,
          "realtor": realtor._id.valueOf(),
          "status": "Available"
        }, {
          "name": "Test apartment 2",
          "description": "My apartment 2",
          "floorAreaSize": 149,
          "pricePerMonth": 100.00,
          "numberOfRooms": 1,
          "address": "355 Lansing St, Indianapolis, IN 46202",
          "latitude": 39.773263,
          "longitude": -86.182098,
          "realtor": realtor._id.valueOf(),
          "status": "Rented"
        }, {
          "name": "Test apartment 3",
          "description": "My apartment 3",
          "floorAreaSize": 59,
          "pricePerMonth": 200.00,
          "numberOfRooms": 2,
          "address": "355 Lansing St, Indianapolis, IN 46202",
          "latitude": 39.773263,
          "longitude": -86.182098,
          "realtor": realtor1._id.valueOf(),
          "status": "Available"
        }
      ])
    })
      .then(apartments => {
        list = apartments;
      });

  });

  after((done) => {
    Promise.all([
      User.remove({}),
      Apartment.remove({})
    ])
    .then(() => {
      done()
    });
  });

  describe('[GET] /apartments', () => {

    it('should get all available apartments for client', () => {
      return request(app)
        .get('/api/v1/apartments')
        .set('Authorization', 'JWT ' + client_token)
        .expect(200)
        .then(({ body }) => {
          body.success.should.equal(1);

          return Apartment.countDocuments({ status: 'Available' })
            .then(count => {
              body.data.length.should.equal(count);
            });
        });
    });

    it('should get all apartments that belongs to a realtor', () => {
      return request(app)
        .get('/api/v1/apartments')
        .set('Authorization', 'JWT ' + realtor_token)
        .expect(200)
        .then(({ body }) => {
          body.success.should.equal(1);

          return Apartment.countDocuments({ realtor: realtor._id.valueOf() })
            .then(count => {
              body.data.length.should.equal(count);
            });
        });
    });

    it('should get all apartments for admin', () => {
      return request(app)
        .get('/api/v1/apartments')
        .set('Authorization', 'JWT ' + admin_token)
        .expect(200)
        .then(({ body }) => {
          body.success.should.equal(1);

          return Apartment.countDocuments({})
            .then(count => {
              body.data.length.should.equal(count);
            });
        });
    });

    it('should filter apartments with size > 90', () => {
      return request(app)
        .get('/api/v1/apartments?sizeOp=gt&sizeVal=90')
        .set('Authorization', 'JWT ' + admin_token)
        .expect(200)
        .then(({ body }) => {
          body.success.should.equal(1);

          return Apartment.countDocuments({ floorAreaSize: {$gt: 90} })
            .then(count => {
              body.data.length.should.equal(count);
            });
        });
    });

    it('should filter apartments with numberOfRooms = 3', () => {
      return request(app)
        .get('/api/v1/apartments?roomsOp=eq&roomsVal=3')
        .set('Authorization', 'JWT ' + admin_token)
        .expect(200)
        .then(({ body }) => {
          body.success.should.equal(1);

          return Apartment.countDocuments({ numberOfRooms: 3 })
            .then(count => {
              body.data.length.should.equal(count);
            });
        });
    });

    it('should filter apartments with pricePerMonth < 200', () => {
      return request(app)
        .get('/api/v1/apartments?priceOp=lt&priceVal=200')
        .set('Authorization', 'JWT ' + admin_token)
        .expect(200)
        .then(({ body }) => {
          body.success.should.equal(1);

          return Apartment.countDocuments({ pricePerMonth: {$lt: 200} })
            .then(count => {
              body.data.length.should.equal(count);
            });
        });
    });

    it('should fail with invalid Operator', () => {
      return request(app)
        .get('/api/v1/apartments?priceOp=lte&priceVal=200')
        .set('Authorization', 'JWT ' + admin_token)
        .expect(400)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('"priceOp" must be one of [gt, lt, eq]');
        });
    });

    it('numberOfRooms must be an integer', () => {
      return request(app)
        .get('/api/v1/apartments?roomsOp=eq&roomsVal=3.01')
        .set('Authorization', 'JWT ' + admin_token)
        .expect(400)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('"roomsVal" must be an integer');
        });
    });

    it('price must be a number', () => {
      return request(app)
        .get('/api/v1/apartments?priceOp=eq&priceVal=a0.01')
        .set('Authorization', 'JWT ' + admin_token)
        .expect(400)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('"priceVal" must be a number');
        });
    });

  });


  describe('[GET] /apartments/:id', () => {

    it('should success', () => {
      return request(app)
        .get('/api/v1/apartments/' + list[0]._id)
        .set('Authorization', 'JWT ' + client_token)
        .expect(200)
        .then(({ body }) => {
          body.success.should.equal(1);

          const expected = list[0].toObject();
          delete expected._id;
          delete expected.realtor;
          delete expected.created;

          body.data.should.containDeep(expected);
        });
    });

    it('should fail with invalid id', () => {
      return request(app)
        .get('/api/v1/apartments/' + client._id)
        .set('Authorization', 'JWT ' + client_token)
        .expect(404)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Can\'t find the apartment');
        });
    });

  });


  describe('[POST] /apartments', () => {

    let payload;

    beforeEach(() => {
      payload = {
        "name": "Test apartment 4",
        "description": "My apartment 4",
        "floorAreaSize": 59,
        "pricePerMonth": 200.00,
        "numberOfRooms": 2,
        "address": "355 Lansing St, Indianapolis, IN 46202",
        "latitude": 39.773263,
        "longitude": -86.182098,
        "status": "Available"
      }
    });

    afterEach((done) => {
      Apartment.remove({"name": "Test apartment 4"})
        .then(() => done());
    });

    it('should success with realtor', () => {
      return request(app)
        .post('/api/v1/apartments')
        .set('Authorization', 'JWT ' + realtor_token)
        .send(payload)
        .expect(201)
        .then(({ body }) => {
          body.success.should.equal(1);
          body.data.should.containDeep(payload);
        });
    });

    it('should success with admin', () => {
      payload.realtor = '' + realtor1._id.valueOf();

      return request(app)
        .post('/api/v1/apartments')
        .set('Authorization', 'JWT ' + admin_token)
        .send(payload)
        .expect(201)
        .then(({ body }) => {
          body.success.should.equal(1);
          body.data.should.containDeep(payload);
        });
    });

    it('should fail without latitude', () => {
      delete payload.latitude;

      return request(app)
        .post('/api/v1/apartments')
        .set('Authorization', 'JWT ' + admin_token)
        .send(payload)
        .expect(400)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('"latitude" is required');
        });
    });

    it('should fail with invalid status', () => {
      payload.status = 'rentable';

      return request(app)
        .post('/api/v1/apartments')
        .set('Authorization', 'JWT ' + admin_token)
        .send(payload)
        .expect(400)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('"status" must be one of [Available, Rented]');
        });
    });

  });

  describe('[PUT] /apartments/:id', () => {

    let payload;

    beforeEach(() => {
      payload = {
        "name": "Test apartment updated",
        "description": "My apartment updated",
        "floorAreaSize": 100,
        "pricePerMonth": 220.00,
        "numberOfRooms": 5,
        "address": "355 Lansing St, INdianapolis, IN 46202",
        "latitude": 39,
        "longitude": -86,
        "status": "Rented"
      }
    });

    after(() => {
      list[0].realtor = realtor;
      return list[0].save();
    });

    it('should success with realtor', (done) => {
      request(app)
        .put('/api/v1/apartments/'+list[0]._id)
        .set('Authorization', 'JWT ' + realtor_token)
        .send(payload)
        .expect(200)
        .then(({ body }) => {
          body.success.should.equal(1);
          
          Apartment.findById(list[0]._id, (err, apartment) => {
            apartment.should.containDeep(payload);
            done();
          });
        });
    });

    it('should success with admin', (done) => {
      request(app)
        .put('/api/v1/apartments/'+list[2]._id)
        .set('Authorization', 'JWT ' + admin_token)
        .send(payload)
        .expect(200)
        .then(({ body }) => {
          body.success.should.equal(1);

          Apartment.findById(list[2]._id, (err, apartment) => {
            apartment.should.containDeep(payload);
            done();
          });
        });
    });

    it('should success with client', () => {
      return request(app)
        .put('/api/v1/apartments/'+list[0]._id)
        .set('Authorization', 'JWT ' + client_token)
        .send(payload)
        .expect(403)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Permission denied');
        });
    });

    it('should fail with another realtor', () => {
      return request(app)
        .put('/api/v1/apartments/'+list[1]._id)
        .set('Authorization', 'JWT ' + realtor1_token)
        .send(payload)
        .expect(403)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Permission denied');
        });
    });

    it('should fail with invalid status', () => {
      payload.status = 'asfsf';

      return request(app)
        .put('/api/v1/apartments/'+list[0]._id)
        .set('Authorization', 'JWT ' + realtor_token)
        .send(payload)
        .expect(400)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('"status" must be one of [Available, Rented]');
        });
    });

    it('should fail with invalid id', () => {
      return request(app)
        .put('/api/v1/apartments/'+client._id.valueOf())
        .set('Authorization', 'JWT ' + realtor_token)
        .send(payload)
        .expect(404)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Can\'t find the apartment');
        });
    });

    it('should not update realtor with realtor', () => {
      payload = {
        realtor: '' + realtor1._id
      };

      return request(app)
        .put('/api/v1/apartments/'+list[0]._id.valueOf())
        .set('Authorization', 'JWT ' + realtor_token)
        .send(payload)
        .expect(400)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('"realtor" is not allowed');
        });
    });

    it('should allow admin to update realtor', (done) => {
      payload = {
        realtor: '' + realtor1._id
      };

      request(app)
        .put('/api/v1/apartments/'+list[0]._id.valueOf())
        .set('Authorization', 'JWT ' + admin_token)
        .send(payload)
        .expect(200)
        .then(({ body }) => {
          body.success.should.equal(1);
          
          Apartment.findById(list[0]._id, (err, apartment) => {
            apartment.should.have.property('realtor').which.containDeep(realtor1._id);
            done();
          });
        });
    });

  });

  describe('[DELETE] /apartments/:id', () => {

    it('should success with realtor', (done) => {
      request(app)
        .delete('/api/v1/apartments/' + list[0]._id)
        .set('Authorization', 'JWT ' + realtor1_token)
        .expect(200)
        .then(({ body }) => {
          body.success.should.equal(1);

          Apartment.findById(list[0]._id, (err, user) => {
            should.not.exist(user);
            done();
          });
        });
    });

    it('should success with admin', (done) => {
      request(app)
        .delete('/api/v1/apartments/' + list[1]._id)
        .set('Authorization', 'JWT ' + admin_token)
        .expect(200)
        .then(({ body }) => {
          body.success.should.equal(1);

          Apartment.findById(list[1]._id, (err, user) => {
              should.not.exist(user);
              done();
            });
        });
    });

    it('should fail with client', () => {
      return request(app)
        .delete('/api/v1/apartments/' + list[2]._id)
        .set('Authorization', 'JWT ' + client_token)
        .expect(403)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Permission denied');
        });
    });

    it('should fail with non-existing apartment', () => {
      return request(app)
        .delete('/api/v1/apartments/' + list[0]._id)
        .set('Authorization', 'JWT ' + admin_token)
        .expect(404)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Can\'t find the apartment');
        });
    });

    it('should fail delete other realtor\'s apartment', () => {
      return request(app)
        .delete('/api/v1/apartments/' + list[2]._id)
        .set('Authorization', 'JWT ' + realtor_token)
        .expect(403)
        .then(({ body }) => {
          body.success.should.equal(0);
          body.data.should.equal('Permission denied');
        });
    });
  });

});