'use strict';

const moment = require('moment-timezone');

const sinon = require('sinon').createSandbox();
const expect = require('must-dist');

const beans = require('../../testutil/configureForTestWithDB').get('beans');
const activitystore = beans.get('activitystore');
const persistence = beans.get('activitiesPersistence');
const Activity = beans.get('activity');

describe('Activity application with DB - shows activities for Group-Ids -', () => {

  const tomorrowEarly = moment().add(1, 'days');
  const tomorrowLate = moment().add(1, 'days').add(1, 'hours');
  const dayAfterTomorrow = moment().add(2, 'days');
  const yesterday = moment().subtract(1, 'days');
  const dayBeforeYesterday = moment().subtract(2, 'days');
  const threeDaysAgo = moment().subtract(3, 'days');

  const futureActivity1 = new Activity({
    id: 'futureActivity1', title: 'Future Activity 1', description: 'description1', assignedGroup: 'groupname1',
    location: 'location1', direction: 'direction1', startUnix: tomorrowEarly.unix(), endUnix: dayAfterTomorrow.unix(),
    url: 'url_future', owner: 'owner', resources: {
      Veranstaltung: {_registeredMembers: [{memberId: 'memberId2'}], _registrationOpen: true},
      AndereVeranstaltung: {_registeredMembers: [{memberId: 'memberId2'}], _registrationOpen: true}
    }, version: 1
  });
  const futureActivity2 = new Activity({
    id: 'futureActivity2',
    title: 'Future Activity 2',
    description: 'description1',
    assignedGroup: 'groupname2',
    location: 'location1',
    direction: 'direction1',
    startUnix: tomorrowLate.unix(),
    endUnix: dayAfterTomorrow.unix(),
    url: 'url_future',
    owner: 'owner',
    resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId'}], _registrationOpen: true}},
    version: 1
  });

  const currentActivity1 = new Activity({
    id: 'currentActivity1',
    title: 'Current Activity 1',
    description: 'description1',
    assignedGroup: 'groupname1',
    location: 'location1',
    direction: 'direction1',
    startUnix: yesterday.unix(),
    endUnix: tomorrowEarly.unix(),
    url: 'url_current',
    owner: 'owner',
    resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId'}], _registrationOpen: true}},
    version: 1
  });
  const currentActivity2 = new Activity({
    id: 'currentActivity2', title: 'Current Activity 2', description: 'description1', assignedGroup: 'groupname2',
    location: 'location1', direction: 'direction1', startUnix: yesterday.unix(), endUnix: tomorrowEarly.unix(),
    url: 'url_current', owner: 'owner', resources: {Veranstaltung: {}}, version: 1
  }); // resource has no registered members!

  const pastActivity1 = new Activity({
    id: 'pastActivity1',
    title: 'Past Activity 1',
    description: 'description1',
    assignedGroup: 'groupname',
    location: 'location1',
    direction: 'direction1',
    startUnix: dayBeforeYesterday.unix(),
    endUnix: yesterday.unix(),
    url: 'url_past',
    owner: 'owner',
    resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId'}], _registrationOpen: true}},
    version: 1
  });

  const pastActivity2 = new Activity({
    id: 'pastActivity2',
    title: 'Past Activity 2',
    description: 'description1',
    assignedGroup: 'groupname',
    location: 'location1',
    direction: 'direction1',
    startUnix: threeDaysAgo.unix(),
    endUnix: threeDaysAgo.unix(),
    url: 'url_past',
    owner: 'owner',
    resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId'}], _registrationOpen: true}},
    version: 1
  });

  beforeEach(done => { // if this fails, you need to start your mongo DB

    persistence.drop(() => {
      activitystore.saveActivity(pastActivity1, err => {
        if (err) { done(err); }
        activitystore.saveActivity(pastActivity2, err1 => {
          if (err1) { done(err1); }
          activitystore.saveActivity(futureActivity1, err2 => {
            if (err2) { done(err2); }
            activitystore.saveActivity(futureActivity2, err3 => {
              if (err3) { done(err3); }
              activitystore.saveActivity(currentActivity1, err4 => {
                if (err4) { done(err4); }
                activitystore.saveActivity(currentActivity2, err5 => {
                  done(err5);
                });
              });
            });
          });
        });
      });
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('shows only current and future activities of Group 1', done => {

    activitystore.upcomingActivitiesForGroupIds(['groupname1'], (err, activities) => {
      expect(activities.length).to.equal(2);
      expect(activities[0].title()).to.equal('Current Activity 1');
      expect(activities[1].title()).to.equal('Future Activity 1');
      done(err);
    });
  });

  it('shows current and future activities of Group 1 and activities with subscribed member', done => {

    activitystore.activitiesForGroupIdsAndRegisteredMemberId(['groupname1'], 'memberId', true, (err, activities) => {
      expect(activities.length).to.equal(3);
      expect(activities[0].title()).to.equal('Current Activity 1');
      expect(activities[1].title()).to.equal('Future Activity 1');
      expect(activities[2].title()).to.equal('Future Activity 2');
      done(err);
    });
  });

  it('shows activity only once even if member is subscribed to multiple resources', done => {

    activitystore.activitiesForGroupIdsAndRegisteredMemberId([], 'memberId2', true, (err, activities) => {
      expect(activities.length).to.equal(1);
      expect(activities[0].title()).to.equal('Future Activity 1');
      done(err);
    });
  });

  it('shows past activities of Group 1 and activities with subscribed member', done => {

    activitystore.activitiesForGroupIdsAndRegisteredMemberId(['groupname1'], 'memberId', false, (err, activities) => {
      expect(activities.length).to.equal(2);
      expect(activities[0].title()).to.equal('Past Activity 1');
      expect(activities[1].title()).to.equal('Past Activity 2');
      done(err);
    });
  });

  it('shows current and future activities of activities with subscribed member', done => {

    activitystore.activitiesForGroupIdsAndRegisteredMemberId([], 'memberId', true, (err, activities) => {
      expect(activities.length).to.equal(2);
      expect(activities[0].title()).to.equal('Current Activity 1');
      expect(activities[1].title()).to.equal('Future Activity 2');
      done(err);
    });
  });

  it('returns an empty list if no matching activities are found', done => {

    activitystore.activitiesForGroupIdsAndRegisteredMemberId([], 'unknownMemberId', true, (err, activities) => {
      expect(activities.length).to.equal(0);
      done(err);
    });
  });

});

describe('Activity application with DB - activitiesForGroupIdsAndRegisteredMemberId without activities -', () => {

  beforeEach(done => { // if this fails, you need to start your mongo DB
    persistence.drop(done);
  });

  it('returns an empty list if there is no collection at all', done => {

    activitystore.activitiesForGroupIdsAndRegisteredMemberId([], 'unknownMemberId', true, (err, activities) => {
      expect(err).to.not.exist();
      expect(activities.length).to.equal(0);
      done(err);
    });
  });

});
