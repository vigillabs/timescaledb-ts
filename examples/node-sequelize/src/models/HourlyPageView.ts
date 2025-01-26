import { Model, DataTypes } from 'sequelize';
import sequelize from '../database';

class HourlyPageView extends Model {
  public bucket!: Date;
  public totalViews!: number;
  public uniqueUsers!: number;
}

HourlyPageView.init(
  {
    bucket: {
      type: DataTypes.DATE,
      primaryKey: true,
    },
    totalViews: {
      type: DataTypes.INTEGER,
      field: 'total_views',
    },
    uniqueUsers: {
      type: DataTypes.INTEGER,
      field: 'unique_users',
    },
  },
  {
    sequelize,
    tableName: 'hourly_page_views',
    timestamps: false,
    underscored: true,
  },
);

export default HourlyPageView;
