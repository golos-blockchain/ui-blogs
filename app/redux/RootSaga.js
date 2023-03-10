import { all, fork } from 'redux-saga/effects'
import { fetchDataWatches } from 'app/redux/FetchDataSaga';
import { sharedWatches } from 'app/redux/SagaShared';
import { userWatches } from 'app/redux/UserSaga';
import { authWatches } from 'app/redux/AuthSaga';
import { pushNotificationWatches } from 'app/redux/services/PushNotificationSaga'
import { transactionWatches } from 'app/redux/TransactionSaga';
import { versionsWatches } from 'app/redux/VersionsSaga'
import PollDataSaga from 'app/redux/PollDataSaga';


export default function* rootSaga() {
  yield fork(PollDataSaga);
  yield fork(userWatches);
  yield fork(fetchDataWatches)
  yield fork(sharedWatches)
  yield fork(authWatches)
  yield fork(pushNotificationWatches)
  yield fork(transactionWatches)
  yield fork(versionsWatches)
}
