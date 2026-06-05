import { all, fork } from 'redux-saga/effects'
import { fetchDataWatches } from 'app/redux/FetchDataSaga';
import { sharedWatches } from 'app/redux/SagaShared';
import { userWatches } from 'app/redux/UserSaga';
import { authWatches } from 'app/redux/AuthSaga';
import { sponsorWatches } from 'app/redux/SponsorsSaga'
import { transactionWatches } from 'app/redux/TransactionSaga';
import { versionsWatches } from 'app/redux/VersionsSaga'


export default function* rootSaga() {
  yield fork(userWatches);
  yield fork(fetchDataWatches)
  yield fork(sharedWatches)
  yield fork(authWatches)
  yield fork(sponsorWatches)
  yield fork(transactionWatches)
  yield fork(versionsWatches)
}
