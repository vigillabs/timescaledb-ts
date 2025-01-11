import { Model, DataTypes } from 'sequelize';
import sequelize from '../database';

class PageLoad extends Model {
  public userAgent!: string;
  public time!: Date;
}

PageLoad.init(
  {
    userAgent: {
      type: DataTypes.TEXT,
      primaryKey: true,
      field: 'user_agent',
    },
    time: {
      type: DataTypes.DATE,
      primaryKey: true,
    },
  },
  {
    sequelize,
    tableName: 'page_loads',
    timestamps: false,
    underscored: true,
  },
);

export default PageLoad;
