import { template } from '../tendersTemplate';
import {createErrorMessage} from '../error/index';

const eventSource = new EventSource('http://localhost:10002/tender');

eventSource.onopen = (e) => console.log('open');

eventSource.onerror = (e) => {
  this.readyState === EventSource.CONNECTING ?
    console.log(`Переподключение (readyState=${this.readyState})...`) :
    console.log('Произошла ошибка.');
};

eventSource.onmessage = (e) => {
  const data = JSON.parse(e.data);

  // if (data.status && data.status === 'end') {
  //   eventSource.close();
  //   console.log('close');
  //
  //   return;
  // }

  console.log(111111)

  console.log(data.status, typeof data.status)

  !data.status && createErrorMessage(data.message);

  template.dispatch(data);
};
