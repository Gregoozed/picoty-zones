import { Sequelize } from 'sequelize';
import config from '../config/database.js';
import { Commune, initCommuneModel } from './Commune.js';
import { User, initUserModel } from './User.js';

const sequelize = new Sequelize(
  config.database!,
  config.username!,
  config.password,
  config
);

initCommuneModel(sequelize);
initUserModel(sequelize);

export { sequelize, Commune, User };
