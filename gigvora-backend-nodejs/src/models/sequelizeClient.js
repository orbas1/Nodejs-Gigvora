import { Sequelize } from 'sequelize';
import databaseConfig from '../config/database.js';

const { url: databaseUrl, ...sequelizeOptions } = databaseConfig;

const sequelize = databaseUrl ? new Sequelize(databaseUrl, sequelizeOptions) : new Sequelize(sequelizeOptions);

export default sequelize;
export { sequelize };
