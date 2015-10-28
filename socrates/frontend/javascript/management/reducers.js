import * as actions from './Actions.js';

const INITIAL_STATE = {
  participants: [],
  waiting: []
};

function reduceParticipants(state = [], action = undefined) {
  switch (action.type) {
  case actions.RECEIVED_PARTICIPANTS:
    return action.payload;
  default:
    return state;
  }
}

function reduceWaiting(state = [], action = undefined) {
  switch (action.type) {
  case actions.RECEIVED_WAITING:
    return action.payload;
  default:
    return state;
  }
}

export default function(state = INITIAL_STATE, action = undefined) {
  return {
    participants: reduceParticipants(state.participants, action),
    waiting: reduceWaiting(state.waiting, action)
  };
}