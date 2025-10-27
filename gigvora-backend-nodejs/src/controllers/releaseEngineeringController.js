import releaseEngineeringService from '../services/releaseEngineeringService.js';

const releaseEngineeringController = {
  async getSuite(request, response) {
    const suite = releaseEngineeringService.getOperationsSuite();
    response.json(suite);
  },
};

export default releaseEngineeringController;
