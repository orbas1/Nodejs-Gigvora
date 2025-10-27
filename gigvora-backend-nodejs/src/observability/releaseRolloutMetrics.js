import { getReleaseRolloutSnapshot } from '../services/releaseManagementService.js';

export async function sampleReleaseRollout() {
  return getReleaseRolloutSnapshot();
}

export default {
  sampleReleaseRollout,
};
