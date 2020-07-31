import { AbstractEventsListener } from 'alliage-events-listener-loader/events-listener';
import { PROCESS_EVENTS } from 'alliage-process-manager/events';
import { Service } from 'alliage-service-loader/decorators';

@Service('dummy_events_listener')
export default class DummyEventsListener extends AbstractEventsListener {
  getEventHandlers() {
    return {
      [PROCESS_EVENTS.PRE_EXECUTE]: this.handlePreExecute,
      [PROCESS_EVENTS.PRE_TERMINATE]: this.handlePreTerminate,
    };
  }

  handlePreExecute() {
    process.stdout.write('Test pre execute\n');
  }

  handlePreTerminate() {
    process.stdout.write('Test pre terminate\n');
  }
}
