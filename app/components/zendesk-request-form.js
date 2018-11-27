import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { reads, bool } from '@ember/object/computed';
import { task } from 'ember-concurrency';
import $ from 'jquery';
import moment from 'moment';
import config from 'travis/config/environment';

const { apiHost, createRequestEndpoint } = config.zendesk;

const UTC_START_TIME = moment.utc({ h: 9, m: 0, s: 0 });
const UTC_END_TIME = moment.utc({ h: 23, m: 0, s: 0 });
const DATE_FORMAT = 'LT';

export default Component.extend({
  classNames: ['zendesk-request-form'],

  auth: service(),

  page: '',

  email: reads('auth.currentUser.email'),

  subject: '',

  description: computed(function () {
    return buildDescriptionTemplate(this.page);
  }),

  isLoggedIn: reads('auth.signedIn'),

  startTime: UTC_START_TIME.local().format(DATE_FORMAT),
  endTime: UTC_END_TIME.local().format(DATE_FORMAT),
  timezone: moment.tz(moment.tz.guess()).format('z'),

  isSubmitting: reads('zendeskRequest.isRunning'),
  isSuccess: bool('zendeskRequest.lastSuccessful.value'),

  zendeskRequest: task(function* () {
    const { fullName: name, email } = this.auth.currentUser;
    const { subject, description: body } = this;

    try {
      return yield $.post(`${apiHost}/${createRequestEndpoint}`, {
        request: {
          requester: { name, email },
          subject,
          comment: { body }
        }
      });
    } catch (error) {
      // TODO handle error
      throw error;
    }
  }),

  actions: {

    handleSubmit() {
      this.zendeskRequest.perform();
      return false;
    }

  }

});

function buildDescriptionTemplate(page) {
  const { language, vendor, userAgent, platform, appVersion } = navigator;
  return `

–––––––––––––––
Page: ${page}

Technical details:
- UserAgent: ${userAgent}
- Vendor: ${vendor}
- Platform: ${platform}
- App Version: ${appVersion}
- Language: ${language}
`;
}
