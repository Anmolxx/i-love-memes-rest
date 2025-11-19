import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'dateRange', async: false })
export class DateRangeValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    const obj = args.object as any;

    if (!obj.startDate || !obj.endDate) {
      return true; // Let @IsISO8601 handle individual validation
    }

    const start = new Date(obj.startDate);
    const end = new Date(obj.endDate);

    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false;
    }

    // End date must be after start date
    if (end <= start) {
      return false;
    }

    // Cannot query future dates
    if (end > new Date()) {
      return false;
    }

    // Maximum range: 2 years
    const maxRange = 2 * 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > maxRange) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return `Invalid date range. Ensure end date is after start date, not in the future, and range is within 2 years. ${JSON.stringify(args)}`;
  }
}
