import { DataTypes, Model } from 'sequelize';
import type { Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare nom: string;
  declare prenom: string;
  declare email: string;
  declare username: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initUserModel(sequelize: Sequelize): typeof User {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      nom: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      prenom: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      username: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      tableName: 'users',
      timestamps: true,
      underscored: true,
    }
  );

  return User;
}
