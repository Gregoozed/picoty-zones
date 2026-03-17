import { DataTypes, Model } from 'sequelize';
import type { Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export class Commune extends Model<InferAttributes<Commune>, InferCreationAttributes<Commune>> {
  declare codeInsee: string;
  declare nom: string;
  declare codePostal: string;
  declare departement: string;
  declare pp: CreationOptional<string | null>;
  declare adblue: CreationOptional<string | null>;
  declare pelletsLiv: CreationOptional<string | null>;
  declare pelletsVrac: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initCommuneModel(sequelize: Sequelize): typeof Commune {
  Commune.init(
    {
      codeInsee: {
        type: DataTypes.STRING(10),
        primaryKey: true,
        field: 'code_insee',
      },
      nom: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      codePostal: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'code_postal',
      },
      departement: {
        type: DataTypes.STRING(5),
        allowNull: true,
      },
      pp: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      adblue: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      pelletsLiv: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'pellets_liv',
      },
      pelletsVrac: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'pellets_vrac',
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
      tableName: 'communes',
      timestamps: true,
      underscored: true,
    }
  );

  return Commune;
}
