export enum TimePeriod {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum ComparisonType {
  WOW = 'WOW', // Week-over-Week
  MOM = 'MOM', // Month-over-Month
  QOQ = 'QOQ', // Quarter-over-Quarter
  YOY = 'YOY', // Year-over-Year
}

export enum TrendDirection {
  UP = 'UP',
  DOWN = 'DOWN',
  STABLE = 'STABLE',
}

export enum MetricType {
  REAL_TIME = 'REAL_TIME',
  DAILY = 'DAILY',
  HISTORICAL = 'HISTORICAL',
  TRENDING = 'TRENDING',
}
