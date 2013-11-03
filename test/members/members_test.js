"use strict";

var request = require('supertest');
var express = require('express');
var sinon = require('sinon').sandbox.create();
var expect = require('chai').expect;

var beans = require('../configureForTest').get('beans');
var Member = beans.get('member');
var membersAPI = beans.get('membersAPI');
var groupsAPI = beans.get('groupsAPI');
var dummymember = new Member({nickname: 'hada', email: 'a@b.c', site: 'http://my.blog', firstname: 'Hans', lastname: 'Dampf'});

var app = express();
app.use(express.urlencoded());
app.use(beans.get('accessrights'));
var membersApp = beans.get('membersApp')(express());
app.use('/', membersApp);

var allMembers;
var getMember;
var getSubscribedGroupsForUser;

describe('Members application', function () {

  beforeEach(function (done) {
    allMembers = sinon.stub(membersAPI, 'allMembers', function (callback) {
      callback(null, [dummymember]);
    });
    getMember = sinon.stub(membersAPI, 'getMember', function (nickname, callback) {
      callback(null, dummymember);
    });
    getSubscribedGroupsForUser = sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (email, callback) {
      callback(null, []);
    });
    done();
  });

  afterEach(function (done) {
    sinon.restore();
    done();
  });

  it('shows the list of members as retrieved from the membersstore', function (done) {
    request(app)
      .get('/')
      .expect(200)
      .expect(/href="\/members\/hada"/)
      .expect(/Hans Dampf/, function (err) {
        expect(allMembers.calledOnce).to.be.ok;
        done(err);
      });
  });

  it('renders the link for single parent dir', function (done) {
    var root = express();
    root.use('/foo', app);
    request(root)
      .get('/foo')
      .expect(/href="\/members\/hada"/, done);
  });

  it('renders the link for two parent dirs', function (done) {
    var root = express();
    root.use('/foo/bar', app);
    request(root)
      .get('/foo/bar')
      .expect(/href="\/members\/hada"/, done);
  });

  it('renders the link for a get request with parameters', function (done) {
    var root = express();
    root.use('/foo', app);
    request(root)
      .get('/foo?param=value')
      .expect(/href="\/members\/hada"/, done);
  });

  it('shows the details of one member as retrieved from the membersstore', function (done) {
    request(app)
      .get('/hada')
      .expect(200)
      .expect(/Blog:(.+)http:\/\/my.blog/, function (err) {
        expect(getMember.calledWith(dummymember.nickname)).to.be.true;
        expect(getSubscribedGroupsForUser.calledWith(dummymember.email)).to.be.true;
        done(err);
      });
  });

  it('validates a duplicate email address via ajax - email is same as previous', function (done) {
    request(app)
      .get('/checkemail?email=my.mail@yourmail.de&previousEmail=my.mail@yourmail.de')
      .expect(200)
      .expect('true', function (err) {
        done(err);
      });
  });

  it('validates a duplicate email address via ajax - email is valid and different to previous', function (done) {
    sinon.stub(membersAPI, 'isValidEmail', function (mail, callback) {
      callback(null, true);
    });
    request(app)
      .get('/checkemail?email=other@x.de&previousEmail=my.mail@yourmail.de')
      .expect(200)
      .expect('true', function (err) {
        done(err);
      });
  });

  it('validates a duplicate email address via ajax - email is invalid and different to previous', function (done) {
    sinon.stub(membersAPI, 'isValidEmail', function (mail, callback) {
      callback(null, false);
    });
    request(app)
      .get('/checkemail?email=other@x.de&previousEmail=my.mail@yourmail.de')
      .expect(200)
      .expect('false', function (err) {
        done(err);
      });
  });

  it('validates a duplicate email address via ajax - email query yields and error and email is different to previous', function (done) {
    sinon.stub(membersAPI, 'isValidEmail', function (mail, callback) {
      callback(new Error());
    });
    request(app)
      .get('/checkemail?email=other@x.de&previousEmail=my.mail@yourmail.de')
      .expect(200)
      .expect('false', function (err) {
        done(err);
      });
  });

  it('validates a duplicate nickname via ajax - nickname is same as previous', function (done) {
    request(app)
      .get('/checknickname?nickname=nickerinack&previousNickname=nickerinack')
      .expect(200)
      .expect('true', function (err) {
        done(err);
      });
  });

  it('validates a duplicate nickname via ajax - nickname is valid and different to previous', function (done) {
    sinon.stub(membersAPI, 'isValidNickname', function (nickname, callback) {
      callback(null, true);
    });
    request(app)
      .get('/checknickname?nickname=nickerinack&previousNickname=bibabu')
      .expect(200)
      .expect('true', function (err) {
        done(err);
      });
  });

  it('validates a duplicate nickname via ajax - nickname is invalid and different to previous', function (done) {
    sinon.stub(membersAPI, 'isValidNickname', function (nickname, callback) {
      callback(null, false);
    });
    request(app)
      .get('/checknickname?nickname=nickerinack&previousNickname=bibabu')
      .expect(200)
      .expect('false', function (err) {
        done(err);
      });
  });

  it('validates a duplicate nickname via ajax - nickname query yields and error and email is different to previous', function (done) {
    sinon.stub(membersAPI, 'isValidNickname', function (nickname, callback) {
      callback(new Error());
    });
    request(app)
      .get('/checknickname?nickname=nickerinack&previousNickname=bibabu')
      .expect(200)
      .expect('false', function (err) {
        done(err);
      });
  });


  it('rejects a member with invalid and different nickname on submit', function (done) {
    sinon.stub(membersAPI, 'isValidNickname', function (nickname, callback) {
      callback(null, false);
    });

    var root = express();
    root.use(express.urlencoded());
    root.use('/', app);
    request(root)
      .post('/submit')
      .send('id=0815&firstname=A&lastname=B&email=c@d.de&previousEmail=c@d.de&location=x&profession=y&reference=z')
      .send('nickname=nickerinack')
      .send('previousNickname=bibabu')
      .expect(200)
      .expect(/Validation Error/)
      .expect(/Dieser Nickname ist leider nicht verfügbar./, function (err) {
        done(err);
      });
  });


  it('rejects a member with invalid and different email address on submit', function (done) {
    sinon.stub(membersAPI, 'isValidEmail', function (nickname, callback) {
      callback(null, false);
    });

    var root = express();
    root.use(express.urlencoded());
    root.use('/', app);
    request(root)
      .post('/submit')
      .send('id=0815&firstname=A&lastname=B&nickname=nuck&previousNickname=nuck&location=x&profession=y&reference=z')
      .send('email=here@there.org')
      .send('previousEmail=there@wherever.com')
      .expect(200)
      .expect(/Validation Error/)
      .expect(/Diese Adresse ist schon registriert. Hast Du bereits ein Profil angelegt?/, function (err) {
        done(err);
      });
  });

  it('rejects a member with missing first and last name on submit', function (done) {

    var root = express();
    root.use(express.urlencoded());
    root.use('/', app);
    request(root)
      .post('/submit')
      .send('id=0815&&nickname=nuck&previousNickname=nuck&location=x&profession=y&reference=z&email=here@there.org&previousEmail=here@there.org')
      .expect(200)
      .expect(/Validation Error/)
      .expect(/Vorname ist ein Pflichtfeld./)
      .expect(/Nachname ist ein Pflichtfeld./, function (err) {
        done(err);
      });
  });

  it('rejects a member with missing first name who validly changed their nickname and mailaddress on submit', function (done) {
    // attention: This combination is required to prove the invocations of the callbacks in case of no error!
    sinon.stub(membersAPI, 'isValidNickname', function (nickname, callback) {
      callback(null, true);
    });
    sinon.stub(membersAPI, 'isValidEmail', function (nickname, callback) {
      callback(null, true);
    });

    var root = express();
    root.use(express.urlencoded());
    root.use('/', app);
    request(root)
      .post('/submit')
      .send('id=0815&&nickname=nuckNew&previousNickname=nuck&lastname=x&location=x&profession=y&reference=z&email=hereNew@there.org&previousEmail=here@there.org')
      .expect(200)
      .expect(/Validation Error/)
      .expect(/Vorname ist ein Pflichtfeld./, function (err) {
        done(err);
      });
  });

  it('rejects a member with invalid nickname and email address on submit, giving two error messages', function (done) {
    sinon.stub(membersAPI, 'isValidNickname', function (nickname, callback) {
      callback(null, false);
    });
    sinon.stub(membersAPI, 'isValidEmail', function (nickname, callback) {
      callback(null, false);
    });

    var root = express();
    root.use(express.urlencoded());
    root.use('/', app);
    request(root)
      .post('/submit')
      .send('id=0815&firstname=A&lastname=B&location=x&profession=y&reference=z')
      .send('nickname=nickerinack')
      .send('previousNickname=bibabu')
      .send('email=here@there.org')
      .send('previousEmail=there@wherever.com')
      .expect(200)
      .expect(/Validation Error/)
      .expect(/Dieser Nickname ist leider nicht verfügbar./)
      .expect(/Diese Adresse ist schon registriert. Hast Du bereits ein Profil angelegt?/, function (err) {
        done(err);
      });
  });

});
