import forOwn from 'lodash/forOwn';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';

let userFunctions = {};

const getEventSequence = (event) => {
  const eventSequence = {};
  const { name, targets } = event;
  if (targets && targets.length > 0) {
    eventSequence.name = name;
    eventSequence.targets = [];
    targets.forEach(target => {
      const { type, props, events } = target;
      const newTarget = {
        type,
        props,
      };
      if (events && events.length > 0 && type === 'userFunction') {
        const newTargetEvents = [];
        events.forEach(targetEvent => {
          newTargetEvents.push(getEventSequence(targetEvent));
        });
        newTarget.events = newTargetEvents;
      }
      eventSequence.targets.push(newTarget);
    });
  }
  return eventSequence;
};

const getActionSequences = (handlers, actionSequences = {}) => {
  if (handlers && handlers.length > 0) {
    handlers.forEach(handler => {
      const { type, props, events } = handler;
      if (events && events.length > 0) {
        events.forEach(event => {
          // console.info('Check target: ', type, props, event);
          let key;
          let handlerObject;
          if (event && event.name && event.targets && event.targets.length > 0) {
            if (type === 'component') {
              key = `${props.componentName}_${props.componentInstance}`;
              handlerObject = actionSequences[key] || { ...props, events: [] };
              const eventSequence = getEventSequence(event);
              // find the same event handler name for the container
              const existingHandlerEventIndex =
                handlerObject.events.findIndex(evn => evn.name === eventSequence.name);
              if (existingHandlerEventIndex >= 0) {
                // here we should merge targets of the same container events handler
                const existingHandlerEventTargets = handlerObject.events[existingHandlerEventIndex];
                if (existingHandlerEventTargets) {
                  console.info('existingHandlerEventTargets: ', existingHandlerEventTargets);
                  handlerObject.events[existingHandlerEventIndex].targets =
                    [...existingHandlerEventTargets.targets, ...eventSequence.targets];
                }
              } else {
                handlerObject.events.push(eventSequence);
              }
              // console.info('Check component: ', key);
              // console.info('Handler object: ', handlerObject);
              actionSequences[key] = handlerObject;
            }
            // console.info('Go through the targets in event: ', event.targets);
            getActionSequences(event.targets, actionSequences);
          }
        });
      }
    });
  }
};

export function getUserFunctionByName (functionName) {
  return get(userFunctions, functionName);
}

function createActionSequencesRecursively (handlers, actionSequences = {}) {
  forOwn(handlers, value => {
    if (isArray(value)) {
      // only arrays should be exported as flow sequences otherwise the object is assumed as a nested sequences
      getActionSequences(value, actionSequences);
    } else if (isObject(value)) {
      // if the handlers is objects it means we have a nested handlers description
      createActionSequencesRecursively(value, actionSequences);
    }
  });
  return actionSequences;
}

export function createActionSequences (handlers, functions) {
  userFunctions = functions;
  const actionSequences = createActionSequencesRecursively(handlers);
  console.info('Action sequences: ', actionSequences);
  return actionSequences;
}
