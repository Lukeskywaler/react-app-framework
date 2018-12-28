import get from 'lodash/get';
import React from 'react';
import { Router, Switch, Route, Link } from 'react-router-dom';

import PageComposition from '../PageComposition';

const NoMatch = () => {
  return (
    <h1>No Match, <Link to="/">Back to home</Link></h1>
  );
};

const NoRoute = () => {
  return (<h1>Routes are missing</h1>);
};

const PageRouter = (props) => {
  const { routes, pages, userComponents, history, actionSequences, targetProperties } = props;
  if (!routes || routes.length === 0) {
    return (<NoRoute/>);
  }
  return (
    <Router history={history}>
      <Switch>
        {routes.map(route =>
          <Route
            key={`route_${route.path}`}
            exact
            path={route.path}
            render={
              ({ match, location }) =>
                <PageComposition
                  key={`page_${route.pageName}`}
                  userComponents={userComponents}
                  componentsTree={get(pages, route.pageName, {})}
                  actionSequences={actionSequences}
                  targetProperties={targetProperties}
                  routePath={route.path}
                  pageParams={match.params}
                  pageSearch={location.search}
                />
            }
          />
        )}
        <Route component={NoMatch}/>
      </Switch>
    </Router>
  );
};

export default PageRouter;