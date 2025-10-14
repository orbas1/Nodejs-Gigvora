import dotenv from 'dotenv';
import app from './app.js';
import { bootstrapOpportunitySearch } from './services/searchIndexService.js';
import { startProfileEngagementWorker } from './services/profileEngagementService.js';
import { startNewsAggregationWorker } from './services/newsAggregationService.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  bootstrapOpportunitySearch().catch((error) => {
    console.error('Failed to bootstrap Meilisearch indexes', error);
  });
  startProfileEngagementWorker();
  startNewsAggregationWorker().catch((error) => {
    console.error('Failed to start Gigvora news aggregation worker', error);
  });
}

app.listen(PORT, () => {
  console.log(`Gigvora API running on port ${PORT}`);
});
