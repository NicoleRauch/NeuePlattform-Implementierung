import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import Addresses from './addresses.js';
import Payments from './payments.js';
import * as actions from './Actions.js';

export class ManagementComponent extends Component {

  componentDidMount() {
    this.props.dispatch(actions.loadParticipants());
    this.props.dispatch(actions.loadWaiting());
  }

  render() {
    return (
      <div className='row'>
        <div className='col-md-12'>
          <div className='page-header'>
            <h2>
              SoCraTes 2015 - Verwaltung
              <a href='/registration' className='btn pull-right btn-default'>Zurück</a>
            </h2>
          </div>
          <Tabs selectedIndex={0}>
            <TabList>
              <Tab>Übersicht</Tab>
              <Tab>Participants</Tab>
              <Tab>Wartelisten</Tab>
              <Tab>Zahlungen</Tab>
              <Tab>Zimmerzuordnungen</Tab>
              <Tab>T-Shirt-Bestellungen</Tab>
              <Tab>Zusatzinformationen</Tab>
              <Tab>Abgemeldete</Tab>
              <Tab>Adressen</Tab>
            </TabList>
            <TabPanel>A</TabPanel>
            <TabPanel>B</TabPanel>
            <TabPanel>C</TabPanel>
            <TabPanel>
              <Payments participants={this.props.participants} />
            </TabPanel>
            <TabPanel>E</TabPanel>
            <TabPanel>F</TabPanel>
            <TabPanel>G</TabPanel>
            <TabPanel>H</TabPanel>
            <TabPanel>
              <Addresses participants={this.props.participants} waiting={this.props.waiting} />
            </TabPanel>
          </Tabs>
        </div>
      </div>
    );
  }
}

export default connect(state => state)(ManagementComponent);