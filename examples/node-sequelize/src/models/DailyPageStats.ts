import { Model, DataTypes } from 'sequelize';
import sequelize from '../database';

class DailyPageStats extends Model {
  public bucket!: Date;
  public sumTotalViews!: number;
  public avgUniqueUsers!: number;
}

DailyPageStats.init(
  {
    bucket: {
      type: DataTypes.DATE,
      primaryKey: true,
    },
    sumTotalViews: {
      type: DataTypes.INTEGER,
      field: 'sum_total_views',
    },
    avgUniqueUsers: {
      type: DataTypes.FLOAT,
      field: 'avg_unique_users',
    },
  },
  {
    sequelize,
    tableName: 'daily_page_stats',
    timestamps: false,
    underscored: true,
  },
);

export default DailyPageStats;
