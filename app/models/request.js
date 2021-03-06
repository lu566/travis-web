import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo } from 'ember-data/relationships';
import { computed } from 'ember-decorators/object';
import { service } from 'ember-decorators/service';
import { alias } from 'ember-decorators/object/computed';

import ObjectProxy from '@ember/object/proxy';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
let ObjectPromiseProxy = ObjectProxy.extend(PromiseProxyMixin);
import { Promise as EmberPromise } from 'rsvp';

const missingYamlResponse = '---\nerror: No YAML found for this request.';

export default Model.extend({
  created_at: attr(),
  event_type: attr(),
  result: attr(),
  message: attr(),
  headCommit: attr(),
  baseCommit: attr(),
  branchName: attr(),
  tagName: attr(),
  pullRequest: attr('boolean'),
  pullRequestTitle: attr(),
  pullRequestNumber: attr('number'),

  yaml_config: attr('string'),

  @computed('yaml_config')
  noYaml(config) {
    return config == missingYamlResponse;
  },

  repo: belongsTo('repo', { async: true }),
  commit: belongsTo('commit', { async: true }),

  // API models this as hasMany but serializers:request#normalize overrides it
  build: belongsTo('build', { async: true }),

  @computed('result', 'build.id')
  isAccepted(result, buildId) {
    // For some reason some of the requests have a null result beside the fact that
    // the build was created. We need to look into it, but for now we can just assume
    // that if build was created, the request was accepted
    return result === 'approved' || buildId;
  },

  @computed('event_type')
  isPullRequest(eventType) {
    return eventType === 'pull_request';
  },

  @service ajax: null,

  @computed('repo.id', 'build.request.id')
  messagesRequest(repoId, requestId) {
    if (repoId && requestId) {
      return ObjectPromiseProxy.create({
        promise: this.get('ajax').ajax(`/repo/${repoId}/request/${requestId}/messages`, 'get', {
          headers: {
            'Travis-API-Version': '3'
          }})
          .then(response => ({messages: response.messages}))
      });
    } else {
      return ObjectPromiseProxy.create({
        promise: EmberPromise.resolve([])
      });
    }
  },

  @alias('messagesRequest.messages') messages: null,
});
